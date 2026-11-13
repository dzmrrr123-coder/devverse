import { getDatabase } from './db'
import { createAnalysisId } from './store'
import type { Analysis } from '../engine/types'
import { guideFor } from '../engine/guide'
import { QUICK_ACTIONS } from '../engine/assistant-types'
import type { QuickAction } from '../engine/assistant-types'

export { QUICK_ACTIONS }
export type { QuickAction }

/**
 * Validasi dasar Google Gemini API Key dari Google AI Studio.
 * Memastikan kunci tidak kosong, tanpa spasi, dan minimal 8 karakter.
 */
export function isValidGeminiKey(key: string): boolean {
  if (!key) return false
  const trimmed = key.trim()
  return trimmed.length >= 8 && !/\s/.test(trimmed)
}

function buildSystemContext(analysis?: Analysis | null): string {
  if (!analysis) {
    return `Kamu adalah Asisten AI Devverse — mentor coding ramah, santai, dan praktis untuk siswa SMK jurusan RPL dan fresh graduate Indonesia. Bantu mereka memahami konsep rekayasa software dengan contoh kode konkret dan penjelasan sederhana.`
  }

  const failingChecks = analysis.checks
    .filter((c) => c.verdict === 'gagal')
    .map((c) => `- ${guideFor(c.id).name} (${c.id}): ${c.evidence}`)
    .join('\n')

  const passedChecks = analysis.checks
    .filter((c) => c.verdict === 'lulus')
    .map((c) => `- ${guideFor(c.id).name} (${c.id})`)
    .join('\n')

  const nextFixText = analysis.nextFix
    ? `${guideFor(analysis.nextFix.id).fix.title} (${guideFor(analysis.nextFix.id).fix.body})`
    : 'Semua check lulus.'

  return `Kamu adalah Asisten AI Devverse — mentor coding ramah, santai, dan praktis untuk siswa SMK jurusan RPL dan fresh graduate Indonesia.

KONTEKS PROYEK SISWA SAAT INI:
- Repository: ${analysis.repo.fullName} (${analysis.repo.url})
- Deskripsi: ${analysis.repo.description ?? 'Tidak ada deskripsi'}
- Bahasa Utama: ${analysis.repo.language ?? 'Belum terdeteksi'}
- Level Kesiapan Saat Ini: Level ${analysis.reachedLevel ?? '1 belum lulus'}
- Level Frontier: Level ${analysis.frontierLevel ?? 'Selesai'}
- Satu Perbaikan Berikutnya: ${nextFixText}

Check yang Lulus:
${passedChecks || '- Belum ada'}

Check yang Masih Gagal:
${failingChecks || '- Tidak ada'}

INSTRUKSI MENJAWAB:
1. Gunakan bahasa Indonesia yang santai, menyemangati, dan to the point (layaknya kakak tingkat atau senior dev yang membimbing adiknya).
2. Hindari jargon rumit tanpa penjelasan singkat.
3. Selalu sertakan blok kode atau contoh berkas konkret yang bisa langsung disalin siswa ke repositorinya.
4. Jika siswa memilih "Analisa lah projek ku untuk pengembangan selanjutnya":
   - Berikan apresiasi atas pencapaian level saat ini.
   - Usulkan 3-4 ide pengembangan fitur berikutnya yang realistis dan menarik di mata penguji/rekruter magang.
   - Usulkan peningkatan teknis (misal: validasi input, testing, struktur modular).
   - Berikan tips portofolio agar proyek ini menonjol saat melamar kerja.`
}

/**
 * Memanggil REST API Google Gemini dengan sanitasi ketat agar API key tidak pernah bocor.
 * Mendukung fallback cerdas antara model gemini-2.0-flash dan gemini-1.5-flash.
 */
export async function callGeminiApi(
  apiKey: string,
  systemInstruction: string,
  userMessage: string,
  preferredModel?: string,
): Promise<{ text: string; modelUsed: string }> {
  const models = [
    preferredModel,
    'gemini-3.8-flash-high',
    'gemini-3.8-flash',
    'gemini-2.0-flash-thinking-exp-01-21',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ].filter(Boolean) as string[]

  let lastError: Error | null = null

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3072,
          },
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        const sanitizedErr = errText.replace(/key=[^&\s"]+/gi, 'key=[REDACTED]')
        try {
          const errJson = JSON.parse(errText) as { error?: { message?: string } }
          const msg = errJson.error?.message || sanitizedErr
          throw new Error(msg.replace(/key=[^&\s"]+/gi, 'key=[REDACTED]'))
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message.includes('API key')) throw parseErr
          throw new Error(`Gemini API error (${response.status}): ${sanitizedErr}`)
        }
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>
          }
        }>
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return { text, modelUsed: model }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (lastError.message.includes('404') || lastError.message.toLowerCase().includes('not found')) continue
      throw lastError
    }
  }

  throw lastError ?? new Error('Gemini API mengembalikan respons kosong.')
}

export async function askAssistant(params: {
  userId: string
  analysisId?: string | null
  analysis?: Analysis | null
  action?: QuickAction
  userPrompt: string
  apiKeyOverride?: string
  preferredModel?: string
}): Promise<{ reply: string; isLiveAi: boolean; modelUsed?: string }> {
  const prompt =
    params.action && params.action !== 'general_chat'
      ? QUICK_ACTIONS[params.action].prompt
      : params.userPrompt

  if (!prompt.trim()) {
    throw new Error('Pesan pertanyaan tidak boleh kosong.')
  }

  const systemContext = buildSystemContext(params.analysis)
  const candidateKey = params.apiKeyOverride || process.env.GEMINI_API_KEY
  const apiKey = candidateKey && isValidGeminiKey(candidateKey) ? candidateKey : null

  let reply = ''
  let isLiveAi = false
  let modelUsed: string | undefined = undefined

  if (apiKey) {
    try {
      const res = await callGeminiApi(apiKey, systemContext, prompt, params.preferredModel)
      reply = res.text
      isLiveAi = true
      modelUsed = res.modelUsed
    } catch (err) {
      const errText = err instanceof Error ? err.message : String(err)
      console.error('Panggilan Gemini API gagal:', errText)
      if (params.apiKeyOverride) {
        // User memasukkan API key sendiri, jangan sembunyikan error di balik template!
        throw new Error(errText)
      }
      reply = generateFallbackReply(params.analysis, params.action, prompt)
    }
  } else {
    reply = generateFallbackReply(params.analysis, params.action, prompt)
  }

  // Simpan riwayat chat ke database
  const db = await getDatabase()
  const msgUser = createAnalysisId()
  const msgAssistant = createAnalysisId()

  await db.query(
    'insert into assistant_messages (id, user_id, analysis_id, role, content) values ($1, $2, $3, $4, $5)',
    [msgUser, params.userId, params.analysisId ?? null, 'user', prompt],
  )
  await db.query(
    'insert into assistant_messages (id, user_id, analysis_id, role, content) values ($1, $2, $3, $4, $5)',
    [msgAssistant, params.userId, params.analysisId ?? null, 'assistant', reply],
  )

  return { reply, isLiveAi, modelUsed }
}

function generateFallbackReply(
  analysis: Analysis | null | undefined,
  action?: QuickAction,
  prompt?: string,
): string {
  const repoName = analysis?.repo.name || 'proyekmu'
  const lang = analysis?.repo.language || 'kode'

  if (action === 'analyze_roadmap' || prompt?.includes('Analisa lah')) {
    return `### Analisa Pengembangan Proyek: ${repoName}

Keren! Proyekmu saat ini sudah berada di **Level ${analysis?.reachedLevel ?? 1}**. Untuk membuat portofolio ini semakin menjual di mata penguji dan rekruter industri, berikut rekomendasi roadmap pengembangannya:

#### 1. Pengembangan Fitur Utama (Functional Roadmap)
- **Otomatisasi Alur Pengguna**: Tambahkan fitur ekspor data (PDF/Excel) atau notifikasi otomatis (email/WhatsApp webhook).
- **Manajemen Role & Akses**: Jika saat ini hanya satu peran pengguna, kembangkan menjadi multi-role (Admin vs Siswa/User) dengan proteksi hak akses yang ketat.
- **Pencarian & Filter Cepat**: Tambahkan pencarian data dengan debouncing dan pagination server-side.

#### 2. Peningkatan Standar Rekayasa (Technical Excellence)
- **Validasi Data**: Pastikan semua input form divalidasi ketat di sisi server untuk mencegah injeksi.
- **Unit Testing Otomatis**: Buat minimal 3-5 unit test untuk menguji fungsi bisnis paling krusial.
- **Struktur Kode Modular**: Pisahkan logika bisnis dari tampilan antarmuka (UI).

#### 3. Kesiapan Portofolio Karier
- Tambahkan screenshot/demo GIF cara kerja proyek di README.
- Catat arsitektur dan alasan pemilihan teknologi di dokumentasi agar bisa kamu jelaskan dengan percaya diri saat wawancara teknis.`
  }

  if (action === 'draft_readme') {
    return `# ${repoName}

Proyek aplikasi ${lang} yang dikembangkan untuk mempermudah alur kerja secara praktis dan terstruktur.

## Fitur Utama
- Antarmuka responsif dan ramah pengguna
- Manajemen data yang terstruktur
- Penanganan error yang informatif

## Prasyarat
- Git
- Runtime / Compiler untuk ${lang}

## Cara Menjalankan
1. Clone repositori ini:
   \`\`\`bash
   git clone ${analysis?.repo.url ?? 'https://github.com/username/repo'}.git
   cd ${repoName}
   \`\`\`
2. Pasang dependensi dan jalankan:
   \`\`\`bash
   # Sesuaikan dengan package manager proyekmu
   pnpm install
   pnpm dev
   \`\`\`

## Lisensi
Didistribusikan di bawah lisensi MIT.`
  }

  if (action === 'draft_ci') {
    return `\`\`\`yaml
name: CI Test & Build
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install & Run Test
        run: |
          npm install
          npm test --if-present
\`\`\``
  }

  if (action === 'draft_env') {
    return `# Konfigurasi Lingkungan (Salin ke .env lokal, JANGAN commit berkas .env asli)
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/dbname
API_SECRET_KEY=ganti_dengan_kunci_rahasia_lokal`
  }

  return `Halo! Untuk proyek **${repoName}**, fokus utamamu saat ini adalah menyelesaikan target perbaikan di **Level ${analysis?.frontierLevel ?? 1}**. Ada bagian kode atau konfigurasi yang ingin saya bantu buatkan drafnya?`
}

export async function getConversationHistory(
  userId: string,
  analysisId?: string | null,
): Promise<Array<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: string }>> {
  const db = await getDatabase()
  const res = analysisId
    ? await db.query<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }>(
        'select id, role, content, created_at from assistant_messages where user_id = $1 and analysis_id = $2 order by created_at asc limit 50',
        [userId, analysisId],
      )
    : await db.query<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }>(
        'select id, role, content, created_at from assistant_messages where user_id = $1 order by created_at asc limit 50',
        [userId],
      )

  return res.rows.map((r) => ({
    id: r.id,
    role: r.role,
    content: r.content,
    createdAt: r.created_at,
  }))
}
