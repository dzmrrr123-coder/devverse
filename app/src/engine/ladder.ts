import { ENGINE_VERSION, checkCatalog } from './checks'
import type {
  Analysis,
  CheckResult,
  Level,
  LevelResult,
  RepoSnapshot,
} from './types'

/**
 * Tangga empat level. Nama level diambil dari frame yang disetujui, bukan
 * dikarang di sini.
 */
export const LEVELS: { level: Level; name: string }[] = [
  { level: 1, name: 'Nyala' },
  { level: 2, name: 'Bisa dijalankan' },
  { level: 3, name: 'Bisa dipercaya' },
  { level: 4, name: 'Siap dibagikan' },
]

function catalogIndex(id: string): number {
  const index = checkCatalog().findIndex((check) => check.id === id)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

/** Urutan kanonik, supaya hasil dari database (tanpa ORDER BY) tetap sama. */
function inCatalogOrder(checks: CheckResult[]): CheckResult[] {
  return [...checks].sort((left, right) => catalogIndex(left.id) - catalogIndex(right.id))
}

/** Menjalankan kesepuluh check. Level di atas frontier tetap dihitung, tapi
 *  ditampilkan sebagai `belum`; laporan yang dibuka ulang tidak perlu API. */
export function evaluateChecks(snapshot: RepoSnapshot): CheckResult[] {
  return checkCatalog().map((definition) => ({
    id: definition.id,
    level: definition.level,
    name: definition.name,
    ...definition.evaluate(snapshot),
  }))
}

export type Ladder = {
  levels: LevelResult[]
  /** Level terakhir yang seluruh check-nya lulus, atau `null`. */
  reachedLevel: Level | null
  /** Level pertama yang belum lulus, atau `null` bila keempatnya lulus. */
  frontierLevel: Level | null
}

/**
 * Berjalan dari Level 1 ke atas dan berhenti menilai di level pertama yang
 * belum lulus. Level di atasnya berstatus `belum` — laporan tidak pernah
 * mengaku tahu sesuatu yang belum dievaluasi.
 */
export function buildLadder(checks: CheckResult[]): Ladder {
  const levels: LevelResult[] = []
  let reachedLevel: Level | null = null
  let frontierLevel: Level | null = null

  for (const { level, name } of LEVELS) {
    const atLevel = checks.filter((check) => check.level === level)
    const passed = atLevel.length > 0 && atLevel.every((check) => check.verdict === 'lulus')

    if (frontierLevel !== null) {
      levels.push({ level, name, state: 'belum' })
      continue
    }

    if (passed) {
      levels.push({ level, name, state: 'lulus' })
      reachedLevel = level
      continue
    }

    levels.push({ level, name, state: 'terbuka' })
    frontierLevel = level
  }

  return { levels, reachedLevel, frontierLevel }
}

/** Check `gagal` pertama di level frontier — satu perbaikan, bukan daftar. */
export function pickNextFix(
  checks: CheckResult[],
  frontierLevel: Level | null,
): CheckResult | null {
  if (frontierLevel === null) return null
  return (
    inCatalogOrder(checks).find(
      (check) => check.level === frontierLevel && check.verdict === 'gagal',
    ) ?? null
  )
}

/**
 * Satu jalur dari snapshot ke laporan. `now` disuntikkan supaya hasilnya bisa
 * diuji tanpa jam dinding.
 */
export function analyze(snapshot: RepoSnapshot, options: { now: Date }): Analysis {
  const checks = evaluateChecks(snapshot)
  const { levels, reachedLevel, frontierLevel } = buildLadder(checks)

  return {
    engineVersion: ENGINE_VERSION,
    repo: {
      owner: snapshot.owner,
      name: snapshot.name,
      fullName: snapshot.fullName,
      url: snapshot.url,
      description: snapshot.description,
      defaultBranch: snapshot.defaultBranch,
      language: snapshot.language,
    },
    commitSha: snapshot.commits?.[0]?.sha ?? null,
    analyzedAt: options.now.toISOString(),
    levels,
    checks,
    reachedLevel,
    frontierLevel,
    nextFix: pickNextFix(checks, frontierLevel),
  }
}
