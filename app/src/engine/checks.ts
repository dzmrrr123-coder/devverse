import type { CheckId, CheckResult, Level, RepoSnapshot } from './types'

/**
 * Sepuluh check, empat level, semuanya fungsi murni atas `RepoSnapshot`.
 * Ambang dan arti level adalah keputusan manusia yang tercatat di `PLAN.md`
 * §10; file ini hanya menjalankannya.
 */

type Outcome = Omit<CheckResult, 'id' | 'level' | 'name'>

export type CheckDefinition = {
  id: CheckId
  level: Level
  /** Nama yang tampil di laporan, sama dengan teks yang disetujui di kanvas. */
  name: string
  evaluate: (snapshot: RepoSnapshot) => Outcome
}

const IGNORED_SEGMENTS = [
  'node_modules',
  'vendor',
  'dist',
  'build',
  'coverage',
  'bower_components',
  '.next',
  '.nuxt',
]

function segments(path: string): string[] {
  return path.toLowerCase().split('/')
}

function baseName(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? path : path.slice(index + 1)
}

/** Folder hasil build dan dependensi tidak pernah dianggap bukti karya sendiri. */
function isIgnored(path: string): boolean {
  const parts = segments(path)
  return IGNORED_SEGMENTS.some((segment) => parts.includes(segment))
}

function hasExtension(name: string, extensions: Set<string>): boolean {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return false
  return extensions.has(name.slice(dot + 1).toLowerCase())
}

function firstPath(paths: string[]): string | null {
  return [...paths].sort((left, right) => left.localeCompare(right))[0] ?? null
}

function evidencePaths(paths: string[], limit = 2): string {
  return [...paths].sort((left, right) => left.localeCompare(right)).slice(0, limit).join(', ')
}

// --- readme_ada -------------------------------------------------------------

const README_FILE = /^readme(\.(md|markdown|rst|txt|adoc))?$/i

/** Di bawah ini README dianggap ada tapi tidak bisa dibaca manusia. */
const README_MIN_CHARS = 80

function readmeAda(snapshot: RepoSnapshot): Outcome {
  const path = firstPath(snapshot.files.filter((file) => !isIgnored(file) && README_FILE.test(baseName(file))))

  if (!path) {
    return {
      verdict: 'gagal',
      evidence: 'tidak ada README di root',
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  const readme = snapshot.readme

  if (!readme) {
    return {
      verdict: 'tidak_tahu',
      evidence: 'README ada, isinya tidak terbaca',
      evidencePath: path,
      evidenceUrl: null,
    }
  }

  const length = readme.text.trim().length

  if (length < README_MIN_CHARS) {
    return {
      verdict: 'gagal',
      evidence: `README terlalu pendek (${length} karakter)`,
      evidencePath: readme.path,
      evidenceUrl: null,
    }
  }

  return {
    verdict: 'lulus',
    evidence: `${length} karakter`,
    evidencePath: readme.path,
    evidenceUrl: null,
  }
}

// --- kode_utama -------------------------------------------------------------

const SOURCE_EXTENSIONS = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'php',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'kts',
  'cs',
  'c',
  'h',
  'cpp',
  'hpp',
  'cc',
  'swift',
  'dart',
  'vue',
  'svelte',
  'astro',
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'sql',
  'sh',
  'ps1',
  'ex',
  'exs',
  'lua',
  'r',
  'pl',
  'scala',
  'clj',
  'fs',
])

function isSourceFile(path: string): boolean {
  const name = baseName(path)
  return !name.includes('.min.') && hasExtension(name, SOURCE_EXTENSIONS)
}

function kodeUtama(snapshot: RepoSnapshot): Outcome {
  const sources = snapshot.files.filter((file) => !isIgnored(file) && isSourceFile(file))

  if (sources.length === 0) {
    return {
      verdict: 'gagal',
      evidence: 'tidak ada file kode yang dikenali',
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  const suffix = snapshot.language ? ` · ${snapshot.language}` : ''

  return {
    verdict: 'lulus',
    evidence: `${sources.length} file sumber${suffix}`,
    evidencePath: firstPath(sources),
    evidenceUrl: null,
  }
}

// --- tanpa_rahasia ----------------------------------------------------------

const SECRET_NAME_RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /(^|\/)\.env$/, label: 'file .env ikut ter-commit' },
  {
    pattern: /(^|\/)\.env\.(local|production|development|test|staging|prod|dev)$/,
    label: 'file .env.* ikut ter-commit',
  },
  { pattern: /\.(pem|key|pfx|p12|jks|keystore|kdbx)$/i, label: 'file kunci/privat ikut ter-commit' },
  {
    pattern: /(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519)$/i,
    label: 'SSH private key ikut ter-commit',
  },
  {
    pattern: /(^|\/)(credentials|secrets)\.json$/i,
    label: 'file kredensial ikut ter-commit',
  },
  {
    pattern: /(^|\/)(service-account|firebase-adminsdk)[^/]*\.json$/i,
    label: 'service account key ikut ter-commit',
  },
  { pattern: /(^|\/)\.htpasswd$/i, label: 'file .htpasswd ikut ter-commit' },
]

function tanpaRahasia(snapshot: RepoSnapshot): Outcome {
  const candidates = snapshot.files.filter((file) => !isIgnored(file))

  for (const file of candidates) {
    const rule = SECRET_NAME_RULES.find(({ pattern }) => pattern.test(file))
    if (rule) {
      return {
        verdict: 'gagal',
        evidence: rule.label,
        evidencePath: file,
        evidenceUrl: null,
      }
    }
  }

  return {
    verdict: 'lulus',
    evidence: `${candidates.length} nama file diperiksa · isi file dan riwayat git tidak dipindai`,
    evidencePath: null,
    evidenceUrl: null,
  }
}

// --- cara_install -----------------------------------------------------------

const INSTALL_HEADING =
  /(install|instalasi|memasang|cara (pakai|jalan|menjalankan)|setup|set up|getting started|quick ?start|how to run|menjalankan aplikasi)/i

const INSTALL_COMMAND =
  /(npm (i|install|ci|run dev|start)|pnpm (i|install|add|dev|start|run)|yarn( install)?|composer (install|require|update)|pip3? install|python -m pip|bundle install|gem install|go (mod download|get|run)|cargo (build|run)|dotnet (restore|run)|docker( compose)? up|php artisan (serve|migrate|key:generate)|flask run|uvicorn|manage\.py runserver|vite|next dev|ng serve|mvn (install|spring-boot:run)|gradle(w)? bootRun|make( [a-z]+)?)/i

function fencedBlocks(markdown: string): string[] {
  return markdown.split('```').filter((_, index) => index % 2 === 1)
}

function caraInstall(snapshot: RepoSnapshot): Outcome {
  const readme = snapshot.readme

  if (!readme) {
    return {
      verdict: 'tidak_tahu',
      evidence: 'isi README tidak terbaca',
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  const heading = readme.text
    .split(/\r?\n/)
    .find((line) => /^#{1,6}\s+/.test(line) && INSTALL_HEADING.test(line))

  if (heading) {
    return {
      verdict: 'lulus',
      evidence: 'ada bagian instalasi',
      evidencePath: `${readme.path} · ${heading.replace(/^#+\s*/, '').trim()}`,
      evidenceUrl: null,
    }
  }

  const command = fencedBlocks(readme.text).find((block) => INSTALL_COMMAND.test(block))

  if (command) {
    return {
      verdict: 'lulus',
      evidence: 'perintah jalan ada di README',
      evidencePath: `${readme.path} · blok perintah`,
      evidenceUrl: null,
    }
  }

  return {
    verdict: 'gagal',
    evidence: 'tidak ada bagian instalasi atau perintah jalan di README',
    evidencePath: readme.path,
    evidenceUrl: null,
  }
}

// --- lockfile ---------------------------------------------------------------

const LOCKFILES = new Set([
  'pnpm-lock.yaml',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
  'deno.lock',
  'composer.lock',
  'gemfile.lock',
  'poetry.lock',
  'pipfile.lock',
  'uv.lock',
  'cargo.lock',
  'go.sum',
  'pubspec.lock',
  'mix.lock',
  'packages.lock.json',
  'gradle.lockfile',
  'podfile.lock',
  // Di ekosistem Python, requirements.txt adalah bentuk kunci versi yang paling
  // umum (pip freeze / pip-tools). Menolaknya membuat proyek Python pemula gagal
  // selamanya tanpa hal yang bisa mereka perbaiki.
  'requirements.txt',
])

const MANIFESTS = new Set([
  'package.json',
  'composer.json',
  'pyproject.toml',
  'pipfile',
  'gemfile',
  'go.mod',
  'cargo.toml',
  'pubspec.yaml',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'deno.json',
])

function isManifest(path: string): boolean {
  const name = baseName(path).toLowerCase()
  return MANIFESTS.has(name) || /\.(csproj|fsproj|sln)$/i.test(name)
}

function lockfile(snapshot: RepoSnapshot): Outcome {
  const candidates = snapshot.files.filter((file) => !isIgnored(file))
  const lock = candidates.find((file) => LOCKFILES.has(baseName(file).toLowerCase()))

  if (lock) {
    return {
      verdict: 'lulus',
      evidence: `lockfile ${baseName(lock)}`,
      evidencePath: lock,
      evidenceUrl: null,
    }
  }

  const manifest = candidates.find(isManifest)

  if (!manifest) {
    return {
      verdict: 'lulus',
      evidence: 'tidak ada manifest dependensi — tidak ada yang perlu dikunci',
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  return {
    verdict: 'gagal',
    evidence: `${baseName(manifest)} ada tanpa lockfile`,
    evidencePath: manifest,
    evidenceUrl: null,
  }
}

// --- env_contoh -------------------------------------------------------------

const ENV_EXAMPLE = /(^|\/)\.env\.(example|sample|template|dist)$/i
const ENV_MENTION = /(process\.env|import\.meta\.env|dotenv|\.env\b|env\.example|variabel lingkungan|environment variable)/i

function envContoh(snapshot: RepoSnapshot): Outcome {
  const candidates = snapshot.files.filter((file) => !isIgnored(file))
  const example = candidates.find((file) => ENV_EXAMPLE.test(file))

  if (example) {
    return {
      verdict: 'lulus',
      evidence: `contoh variabel lingkungan ${baseName(example)}`,
      evidencePath: example,
      evidenceUrl: null,
    }
  }

  const mentionsEnv = snapshot.readme ? ENV_MENTION.test(snapshot.readme.text) : false

  if (!mentionsEnv) {
    return {
      verdict: 'lulus',
      evidence: 'README tidak memakai variabel lingkungan',
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  return {
    verdict: 'gagal',
    evidence: 'README memakai variabel lingkungan tapi tidak ada .env.example',
    evidencePath: snapshot.readme?.path ?? null,
    evidenceUrl: null,
  }
}

// --- ada_test ---------------------------------------------------------------

const TEST_BASE_FILES = new Set([
  'testcase.php',
  'conftest.py',
  '__init__.py',
  'setup.py',
  'vitest.setup.ts',
  'jest.setup.js',
  'jest.setup.ts',
  'phpunit.xml',
  'phpunit.xml.dist',
])

function isTestFile(path: string): boolean {
  const name = baseName(path)
  if (TEST_BASE_FILES.has(name.toLowerCase())) return false
  if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte)$/i.test(name)) return true
  if (/(_test\.(go|py|rb|exs)|^test_.*\.py)$/i.test(name)) return true
  if (/(Test|Tests)\.(php|java|kt|cs|scala|fs|swift)$/.test(name)) return true
  if (/_spec\.rb$/i.test(name)) return true
  return /(^|\/)(tests?|__tests__|spec|e2e|cypress)\//i.test(path)
}

function adaTest(snapshot: RepoSnapshot): Outcome {
  const tests = snapshot.files.filter((file) => !isIgnored(file) && isTestFile(file))

  if (tests.length === 0) {
    return {
      verdict: 'gagal',
      evidence: 'tidak ada file test yang dikenali',
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  return {
    verdict: 'lulus',
    evidence: `${tests.length} file test`,
    evidencePath: evidencePaths(tests),
    evidenceUrl: null,
  }
}

// --- ci_jalan ---------------------------------------------------------------

const WORKFLOW = /^\.github\/workflows\/[^/]+\.ya?ml$/i

/**
 * "Jalan" berarti run sukses terbaca pada commit terakhir — bukan sekadar file
 * workflow-nya ada. Keputusan manusia, `PLAN.md` §10.
 */
function ciJalan(snapshot: RepoSnapshot): Outcome {
  const workflow = firstPath(snapshot.files.filter((file) => WORKFLOW.test(file)))

  if (!workflow) {
    return {
      verdict: 'gagal',
      evidence: 'tidak ada .github/workflows',
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  if (snapshot.ciRuns === null) {
    return {
      verdict: 'tidak_tahu',
      evidence: snapshot.ciUnavailableReason ?? 'data GitHub Actions tidak terbaca',
      evidencePath: workflow,
      evidenceUrl: null,
    }
  }

  if (snapshot.ciRuns.length === 0) {
    return {
      verdict: 'gagal',
      evidence: 'workflow ada, belum ada run terbaca di commit terakhir',
      evidencePath: workflow,
      evidenceUrl: null,
    }
  }

  const success = snapshot.ciRuns.find((run) => run.conclusion === 'success')

  if (success) {
    return {
      verdict: 'lulus',
      evidence: `${success.name} · sukses`,
      evidencePath: workflow,
      evidenceUrl: success.url,
    }
  }

  const latest = snapshot.ciRuns[0]

  return {
    verdict: 'gagal',
    evidence: `${latest.name} · ${latest.conclusion ?? 'belum selesai'}`,
    evidencePath: workflow,
    evidenceUrl: latest.url,
  }
}

// --- riwayat_commit ---------------------------------------------------------

/** Ambang manusia: minimal 3 commit, pesan tidak dinilai. */
const MIN_COMMITS = 3

function riwayatCommit(snapshot: RepoSnapshot): Outcome {
  if (snapshot.commits === null) {
    return {
      verdict: 'tidak_tahu',
      evidence: snapshot.commitsUnavailableReason ?? 'riwayat commit tidak terbaca',
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  const count = snapshot.commits.length

  if (count >= MIN_COMMITS) {
    return {
      verdict: 'lulus',
      evidence: `${count} commit terbaca`,
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  return {
    verdict: 'gagal',
    evidence: count === 0 ? 'tidak ada commit terbaca' : `baru ${count} commit`,
    evidencePath: null,
    evidenceUrl: null,
  }
}

// --- lisensi_ada ------------------------------------------------------------

function lisensiAda(snapshot: RepoSnapshot): Outcome {
  const license = snapshot.license

  if (!license) {
    return {
      verdict: 'gagal',
      evidence: 'tidak ada file lisensi',
      evidencePath: null,
      evidenceUrl: null,
    }
  }

  const licenseFile = snapshot.files.find((file) => /^licen[cs]e(\..+)?$/i.test(baseName(file)))

  return {
    verdict: 'lulus',
    evidence: license === 'NOASSERTION' ? 'lisensi tidak dikenali GitHub' : license,
    evidencePath: licenseFile ?? null,
    evidenceUrl: null,
  }
}

// --- daftar kanonik ---------------------------------------------------------

/**
 * Urutan array ini adalah urutan tampil dan urutan "satu perbaikan berikutnya":
 * check `gagal` pertama di level yang sedang dijalani.
 */
const CATALOG: CheckDefinition[] = [
  { id: 'readme_ada', level: 1, name: 'readme_ada', evaluate: readmeAda },
  { id: 'kode_utama', level: 1, name: 'kode_utama', evaluate: kodeUtama },
  { id: 'tanpa_rahasia', level: 1, name: 'tanpa_rahasia', evaluate: tanpaRahasia },
  { id: 'cara_install', level: 2, name: 'cara_install', evaluate: caraInstall },
  { id: 'lockfile', level: 2, name: 'lockfile', evaluate: lockfile },
  { id: 'env_contoh', level: 2, name: 'env_contoh', evaluate: envContoh },
  { id: 'ada_test', level: 3, name: 'Ada test otomatis', evaluate: adaTest },
  { id: 'ci_jalan', level: 3, name: 'CI jalan di setiap push', evaluate: ciJalan },
  { id: 'riwayat_commit', level: 3, name: 'Riwayat commit terbaca', evaluate: riwayatCommit },
  { id: 'lisensi_ada', level: 4, name: 'lisensi_ada', evaluate: lisensiAda },
]

/** Dipakai juga saat membaca ulang laporan dari database, untuk nama check. */
export function checkCatalog(): readonly CheckDefinition[] {
  return CATALOG
}

export const ENGINE_VERSION = '1.0.0'
