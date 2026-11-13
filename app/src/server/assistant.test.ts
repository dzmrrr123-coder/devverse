import { describe, expect, it } from 'vitest'
import { askAssistant, getConversationHistory } from './assistant'
import { getOrCreateUser } from './auth'
import { pgliteAnalysisStore } from './store'
import { fixtureGitHubClient } from '../github/fixture'
import { loadSnapshot } from '../github/snapshot'
import { analyze } from '../engine/ladder'

const NOW = new Date('2026-11-12T07:07:00.000Z')

describe('AI Assistant module', () => {
  it('generates roadmap recommendation for "analyze_roadmap" quick action', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_assistant_test',
      username: 'siswa_ai_test',
    })

    const snapshot = await loadSnapshot(
      fixtureGitHubClient('absensi-qr'),
      'rizky',
      'absensi-qr',
    )
    const analysis = analyze(snapshot, { now: NOW })
    const store = pgliteAnalysisStore()
    const savedId = await store.save(analysis, { ipHash: 'test-ip' })

    const res = await askAssistant({
      userId: user.id,
      analysisId: savedId,
      analysis,
      action: 'analyze_roadmap',
      userPrompt: '',
      apiKeyOverride: 'none',
    })

    expect(typeof res.reply).toBe('string')
    // Verifies the user's specific request: roadmap / pengembangan selanjutnya
    expect(res.reply).toContain('Analisa Pengembangan Proyek')
    expect(res.reply).toContain('Fitur')
    expect(res.reply).toContain('Portofolio')

    // Verifies conversation was recorded in database
    const history = await getConversationHistory(user.id, savedId)
    expect(history.length).toBeGreaterThanOrEqual(2)
    expect(history[0].role).toBe('user')
    expect(history[1].role).toBe('assistant')
  })

  it('generates README draft for draft_readme action', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_readme_test',
      username: 'siswa_readme',
    })

    const snapshot = await loadSnapshot(
      fixtureGitHubClient('bare-html'),
      'pemula',
      'bare-html',
    )
    const analysis = analyze(snapshot, { now: NOW })

    const res = await askAssistant({
      userId: user.id,
      analysis,
      action: 'draft_readme',
      userPrompt: '',
      apiKeyOverride: 'none',
    })

    expect(res.reply).toContain('Cara Menjalankan')
    expect(res.reply).toContain('Fitur Utama')
  })

  it('generates GitHub Actions CI draft for draft_ci action', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_ci_test',
      username: 'siswa_ci',
    })

    const res = await askAssistant({
      userId: user.id,
      action: 'draft_ci',
      userPrompt: '',
      apiKeyOverride: 'none',
    })

    expect(res.reply).toContain('name: CI')
    expect(res.reply).toContain('actions/checkout')
  })
})
