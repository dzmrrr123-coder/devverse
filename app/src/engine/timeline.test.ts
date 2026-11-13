import { describe, expect, it } from 'vitest'
import { calculateMilestone, buildTimeline } from './timeline'
import { fixtureGitHubClient } from '../github/fixture'
import { loadSnapshot } from '../github/snapshot'
import { analyze } from './ladder'

const TIME_1 = new Date('2026-11-10T10:00:00Z')
const TIME_2 = new Date('2026-11-12T14:00:00Z')

describe('timeline and commit progress delta', () => {
  it('calculates progress delta when level increases from Level 1 to Level 2', async () => {
    const snap1 = await loadSnapshot(fixtureGitHubClient('bare-html'), 'siswa', 'proyek')
    const analysis1 = analyze(snap1, { now: TIME_1 })

    const snap2 = await loadSnapshot(fixtureGitHubClient('absensi-qr'), 'siswa', 'proyek')
    const analysis2 = analyze(snap2, { now: TIME_2 })

    const milestone = calculateMilestone(analysis2, 'id_second', analysis1)

    expect(milestone.levelChange).toBe(1) // Naik 1 level
    expect(milestone.reachedLevel).toBe(2)
    // cara_install was failing in bare-html, now passing in absensi-qr
    expect(milestone.fixedChecks).toContain('cara_install')
    expect(milestone.regressedChecks).toContain('riwayat_commit')
  })

  it('builds chronological timeline with latest milestone first', async () => {
    const snap1 = await loadSnapshot(fixtureGitHubClient('bare-html'), 'siswa', 'proyek')
    const analysis1 = analyze(snap1, { now: TIME_1 })

    const snap2 = await loadSnapshot(fixtureGitHubClient('absensi-qr'), 'siswa', 'proyek')
    const analysis2 = analyze(snap2, { now: TIME_2 })

    const timeline = buildTimeline([
      { id: 'id_1', analysis: analysis1 },
      { id: 'id_2', analysis: analysis2 },
    ])

    expect(timeline.length).toBe(2)
    // Latest milestone is first
    expect(timeline[0].analysisId).toBe('id_2')
    expect(timeline[0].levelChange).toBe(1)
    expect(timeline[1].analysisId).toBe('id_1')
    expect(timeline[1].levelChange).toBe(0)
  })
})
