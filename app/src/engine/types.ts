/**
 * Bentuk data yang dihasilkan adapter GitHub dan dibaca engine.
 *
 * Engine tidak pernah memanggil jaringan: seluruh masukannya adalah
 * `RepoSnapshot`, sehingga setiap check bisa diuji pada fixture di memori.
 */

/** Tiga hasil check, dan tidak ada yang keempat. */
export type Verdict = 'lulus' | 'gagal' | 'tidak_tahu'

export type Level = 1 | 2 | 3 | 4

/**
 * Sepuluh check, dengan nama yang dipakai laporan sekaligus sebagai kunci
 * `check_result` di database. Tiga yang pertama tampil apa adanya di kanvas,
 * tiga terakhir memakai kalimat yang disetujui.
 */
export type CheckId =
  | 'readme_ada'
  | 'kode_utama'
  | 'tanpa_rahasia'
  | 'cara_install'
  | 'lockfile'
  | 'env_contoh'
  | 'ada_test'
  | 'ci_jalan'
  | 'riwayat_commit'
  | 'lisensi_ada'

export type Readme = {
  path: string
  text: string
}

export type RepoCommit = {
  sha: string
  date: string
}

/**
 * Satu run CI pada commit HEAD. `conclusion` bisa `null` ketika run masih
 * berjalan; itu bukan lulus.
 */
export type CiRun = {
  name: string
  conclusion: string | null
  url: string
}

export type RepoSnapshot = {
  owner: string
  name: string
  fullName: string
  url: string
  defaultBranch: string
  description: string | null
  homepage: string | null
  /** SPDX id dari GitHub (`MIT`, `NOASSERTION`, ...), bukan isi file LICENSE. */
  license: string | null
  language: string | null
  sizeKb: number
  readme: Readme | null
  /** Seluruh jalur blob pada tree HEAD, sudah rekursif. */
  files: string[]
  /** `null` berarti riwayat tidak terbaca, bukan "tidak ada commit". */
  commits: RepoCommit[] | null
  commitsUnavailableReason: string | null
  /** `null` berarti data Actions tidak terbaca, bukan "tidak ada run". */
  ciRuns: CiRun[] | null
  ciUnavailableReason: string | null
}

export type CheckResult = {
  id: CheckId
  level: Level
  /** Nama yang tampil di laporan. */
  name: string
  verdict: Verdict
  /** Satu kalimat. Wajib berisi alasan ketika `tidak_tahu`. */
  evidence: string
  evidencePath: string | null
  evidenceUrl: string | null
}

export type LevelState = 'lulus' | 'terbuka' | 'belum'

export type LevelResult = {
  level: Level
  name: string
  state: LevelState
}

export type Analysis = {
  engineVersion: string
  repo: {
    owner: string
    name: string
    fullName: string
    url: string
    description: string | null
    defaultBranch: string
    language: string | null
  }
  commitSha: string | null
  analyzedAt: string
  levels: LevelResult[]
  checks: CheckResult[]
  /** Level terakhir yang seluruh check-nya lulus, atau `null` bila Level 1 pun belum. */
  reachedLevel: Level | null
  /** Level pertama yang belum lulus, atau `null` bila keempatnya lulus. */
  frontierLevel: Level | null
  /** Check `gagal` pertama di level frontier, atau `null` bila tidak ada yang gagal. */
  nextFix: CheckResult | null
}
