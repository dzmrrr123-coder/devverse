import { describe, expect, it } from 'vitest'
import { checkCatalog } from './checks'
import type { CheckId, RepoSnapshot, Verdict } from './types'

/**
 * Satu berkas untuk perilaku tiap check: apa yang lulus, apa yang gagal, dan
 * kapan jawabannya jujur "tidak tahu". Snapshot disusun di sini, bukan dibaca
 * dari disk, supaya setiap kasus hanya bergantung pada satu variabel.
 */

const README_TEXT = [
  '# Proyek',
  '',
  'Aplikasi catatan kecil untuk latihan.',
  '',
  '## Cara install',
  '',
  '```bash',
  'pnpm install',
  'pnpm dev',
  '```',
].join('\n')

function base(overrides: Partial<RepoSnapshot> = {}): RepoSnapshot {
  return {
    owner: 'siswa',
    name: 'proyek',
    fullName: 'siswa/proyek',
    url: 'https://github.com/siswa/proyek',
    defaultBranch: 'main',
    description: 'Proyek latihan',
    homepage: null,
    license: 'MIT',
    language: 'TypeScript',
    sizeKb: 10,
    readme: { path: 'README.md', text: README_TEXT },
    files: ['README.md', 'src/index.ts', '.env.example', 'pnpm-lock.yaml', 'package.json'],
    commits: [
      { sha: 'a', date: '2026-11-03T00:00:00Z' },
      { sha: 'b', date: '2026-11-02T00:00:00Z' },
      { sha: 'c', date: '2026-11-01T00:00:00Z' },
    ],
    commitsUnavailableReason: null,
    ciRuns: [],
    ciUnavailableReason: null,
    ...overrides,
  }
}

function verdict(id: CheckId, overrides: Partial<RepoSnapshot> = {}): Verdict {
  const check = checkCatalog().find((candidate) => candidate.id === id)
  if (!check) throw new Error(`check tidak dikenal: ${id}`)
  return check.evaluate(base(overrides)).verdict
}

describe('readme_ada', () => {
  it('lulus ketika README cukup panjang', () => {
    expect(verdict('readme_ada')).toBe('lulus')
  })

  it('gagal ketika README hanya beberapa karakter', () => {
    expect(verdict('readme_ada', { readme: { path: 'README.md', text: 'halo' } })).toBe('gagal')
  })

  it('gagal ketika tidak ada README sama sekali', () => {
    expect(verdict('readme_ada', { readme: null, files: ['index.html'] })).toBe('gagal')
  })

  it('tidak_tahu ketika berkasnya ada tapi isinya tidak terbaca', () => {
    expect(verdict('readme_ada', { readme: null })).toBe('tidak_tahu')
  })
})

describe('kode_utama', () => {
  it('lulus dengan satu file sumber', () => {
    expect(verdict('kode_utama')).toBe('lulus')
  })

  it('gagal ketika hanya ada README dan gambar', () => {
    expect(verdict('kode_utama', { files: ['README.md', 'img/logo.png'] })).toBe('gagal')
  })

  it('mengabaikan node_modules dan dist', () => {
    expect(
      verdict('kode_utama', { files: ['README.md', 'node_modules/a/index.js', 'dist/app.js'] }),
    ).toBe('gagal')
  })
})

describe('tanpa_rahasia', () => {
  it('lulus pada repo bersih dan menyatakan batas pemindaian', () => {
    const check = checkCatalog().find((candidate) => candidate.id === 'tanpa_rahasia')
    const outcome = check?.evaluate(base())
    expect(outcome?.verdict).toBe('lulus')
    expect(outcome?.evidence).toContain('riwayat git tidak dipindai')
  })

  it('gagal ketika .env ikut ter-commit', () => {
    expect(
      verdict('tanpa_rahasia', { files: ['README.md', 'src/index.ts', '.env'] }),
    ).toBe('gagal')
  })

  it('tidak menghukum .env.example', () => {
    expect(verdict('tanpa_rahasia')).toBe('lulus')
  })

  it('gagal ketika SSH private key ikut ter-commit', () => {
    expect(verdict('tanpa_rahasia', { files: ['README.md', 'id_rsa'] })).toBe('gagal')
  })
})

describe('cara_install', () => {
  it('lulus karena ada bagian instalasi', () => {
    expect(verdict('cara_install')).toBe('lulus')
  })

  it('lulus karena ada blok perintah tanpa heading khusus', () => {
    const readme = { path: 'README.md', text: `# Proyek\n\n${'x'.repeat(90)}\n\n\`\`\`\ncomposer install\n\`\`\`\n` }
    expect(verdict('cara_install', { readme })).toBe('lulus')
  })

  it('gagal ketika README tidak menyebut cara menjalankan', () => {
    const readme = { path: 'README.md', text: `# Proyek\n\n${'x'.repeat(120)}\n` }
    expect(verdict('cara_install', { readme })).toBe('gagal')
  })

  it('tidak_tahu ketika isi README tidak terbaca', () => {
    expect(verdict('cara_install', { readme: null })).toBe('tidak_tahu')
  })
})

describe('lockfile', () => {
  it('lulus dengan lockfile yang dikenal', () => {
    expect(verdict('lockfile')).toBe('lulus')
  })

  it('gagal ketika manifest ada tanpa lockfile', () => {
    expect(verdict('lockfile', { files: ['README.md', 'package.json'] })).toBe('gagal')
  })

  it('lulus ketika tidak ada dependensi untuk dikunci', () => {
    expect(verdict('lockfile', { files: ['README.md', 'index.html'] })).toBe('lulus')
  })
})

describe('env_contoh', () => {
  it('lulus dengan .env.example', () => {
    expect(verdict('env_contoh')).toBe('lulus')
  })

  it('gagal ketika README memakai env tanpa contoh', () => {
    const readme = {
      path: 'README.md',
      text: `${'x'.repeat(100)}\njalankan dengan process.env.API_KEY`,
    }
    expect(verdict('env_contoh', { readme, files: ['README.md', 'src/index.ts'] })).toBe('gagal')
  })

  it('lulus ketika README tidak memakai variabel lingkungan', () => {
    const readme = { path: 'README.md', text: `${'x'.repeat(120)}\n` }
    expect(verdict('env_contoh', { readme, files: ['README.md', 'index.html'] })).toBe('lulus')
  })
})

describe('ada_test', () => {
  it('lulus dengan satu file test', () => {
    expect(verdict('ada_test', { files: ['README.md', 'tests/notes.test.ts'] })).toBe('lulus')
  })

  it('gagal ketika tidak ada file test', () => {
    expect(verdict('ada_test', { files: ['README.md', 'src/index.ts'] })).toBe('gagal')
  })

  it('tidak menghitung kelas dasar phpunit sebagai test', () => {
    expect(verdict('ada_test', { files: ['README.md', 'tests/TestCase.php'] })).toBe('gagal')
  })
})

describe('ci_jalan', () => {
  const withWorkflow = ['.github/workflows/ci.yml']

  it('gagal dengan kalimat yang sama seperti di kanvas', () => {
    const check = checkCatalog().find((candidate) => candidate.id === 'ci_jalan')
    const outcome = check?.evaluate(base({ files: ['README.md'] }))
    expect(outcome?.verdict).toBe('gagal')
    expect(outcome?.evidence).toBe('tidak ada .github/workflows')
  })

  it('lulus ketika run sukses terbaca', () => {
    expect(
      verdict('ci_jalan', {
        files: withWorkflow,
        ciRuns: [
          { name: 'ci', conclusion: 'success', url: 'https://github.com/x/y/actions/runs/1' },
        ],
      }),
    ).toBe('lulus')
  })

  it('gagal ketika workflow ada tapi belum ada run', () => {
    expect(verdict('ci_jalan', { files: withWorkflow, ciRuns: [] })).toBe('gagal')
  })

  it('gagal ketika run terakhir merah', () => {
    expect(
      verdict('ci_jalan', {
        files: withWorkflow,
        ciRuns: [{ name: 'ci', conclusion: 'failure', url: 'https://github.com/x/y/runs/2' }],
      }),
    ).toBe('gagal')
  })

  it('tidak_tahu ketika data Actions tidak terbaca', () => {
    expect(
      verdict('ci_jalan', {
        files: withWorkflow,
        ciRuns: null,
        ciUnavailableReason: 'batas API GitHub 60/jam',
      }),
    ).toBe('tidak_tahu')
  })
})

describe('riwayat_commit', () => {
  it('lulus dengan tiga commit', () => {
    expect(verdict('riwayat_commit')).toBe('lulus')
  })

  it('gagal dengan dua commit', () => {
    expect(
      verdict('riwayat_commit', {
        commits: [
          { sha: 'a', date: '2026-11-02T00:00:00Z' },
          { sha: 'b', date: '2026-11-01T00:00:00Z' },
        ],
      }),
    ).toBe('gagal')
  })

  it('tidak_tahu ketika riwayat tidak terbaca', () => {
    expect(
      verdict('riwayat_commit', {
        commits: null,
        commitsUnavailableReason: 'batas API GitHub 60/jam',
      }),
    ).toBe('tidak_tahu')
  })
})

describe('lisensi_ada', () => {
  it('lulus dengan lisensi yang dikenali', () => {
    expect(verdict('lisensi_ada')).toBe('lulus')
  })

  it('lulus tapi memberi catatan ketika GitHub tidak mengenali lisensinya', () => {
    const check = checkCatalog().find((candidate) => candidate.id === 'lisensi_ada')
    const outcome = check?.evaluate(base({ license: 'NOASSERTION' }))
    expect(outcome?.verdict).toBe('lulus')
    expect(outcome?.evidence).toContain('tidak dikenali GitHub')
  })

  it('gagal ketika repo tidak punya lisensi', () => {
    expect(verdict('lisensi_ada', { license: null })).toBe('gagal')
  })
})

describe('bentuk katalog', () => {
  it('sepuluh check, id unik, dan tiap level terisi', () => {
    const catalog = checkCatalog()
    expect(catalog).toHaveLength(10)
    expect(new Set(catalog.map((check) => check.id)).size).toBe(10)
    for (const level of [1, 2, 3, 4] as const) {
      expect(catalog.some((check) => check.level === level)).toBe(true)
    }
  })
})
