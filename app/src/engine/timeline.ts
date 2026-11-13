import type { Analysis, CheckId, Verdict } from './types'

export type CheckDelta = {
  checkId: CheckId
  previousVerdict: Verdict
  currentVerdict: Verdict
}

export type TimelineMilestone = {
  analysisId: string
  commitSha: string | null
  analyzedAt: string
  reachedLevel: number | null
  frontierLevel: number | null
  levelChange: number // misal +1, 0, -1
  fixedChecks: CheckId[] // check yang tadinya gagal/tidak_tahu, sekarang lulus
  regressedChecks: CheckId[] // check yang tadinya lulus, sekarang gagal
}

/**
 * Membandingkan dua analisis repositori yang sama (commit sebelumnya vs commit sekarang)
 * untuk mengetahui kemajuan belajar dan perbaikan yang berhasil dilakukan siswa.
 */
export function calculateMilestone(
  current: Analysis,
  analysisId: string,
  previous?: Analysis | null,
): TimelineMilestone {
  const currentReached = current.reachedLevel ?? 0
  const prevReached = previous?.reachedLevel ?? 0

  const levelChange = previous ? currentReached - prevReached : 0
  const fixedChecks: CheckId[] = []
  const regressedChecks: CheckId[] = []

  if (previous) {
    const prevChecksMap = new Map(previous.checks.map((c) => [c.id, c.verdict]))

    for (const currCheck of current.checks) {
      const prevVerdict = prevChecksMap.get(currCheck.id)
      if (prevVerdict && prevVerdict !== 'lulus' && currCheck.verdict === 'lulus') {
        fixedChecks.push(currCheck.id)
      } else if (prevVerdict === 'lulus' && currCheck.verdict !== 'lulus') {
        regressedChecks.push(currCheck.id)
      }
    }
  }

  return {
    analysisId,
    commitSha: current.commitSha,
    analyzedAt: current.analyzedAt,
    reachedLevel: current.reachedLevel,
    frontierLevel: current.frontierLevel,
    levelChange,
    fixedChecks,
    regressedChecks,
  }
}

/**
 * Menyusun timeline kronologis dari daftar analisis sebuah repositori
 * (dari yang paling lama ke yang terbaru, lalu dihitung perubahannya).
 */
export function buildTimeline(
  analyses: Array<{ id: string; analysis: Analysis }>,
): TimelineMilestone[] {
  if (analyses.length === 0) return []

  // Urutkan dari yang paling lama ke yang paling baru
  const sorted = [...analyses].sort(
    (a, b) => new Date(a.analysis.analyzedAt).getTime() - new Date(b.analysis.analyzedAt).getTime(),
  )

  const milestones: TimelineMilestone[] = []

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    const previous = i > 0 ? sorted[i - 1].analysis : null
    milestones.push(calculateMilestone(current.analysis, current.id, previous))
  }

  // Balik urutan agar milestone terbaru tampil di paling atas
  return milestones.reverse()
}
