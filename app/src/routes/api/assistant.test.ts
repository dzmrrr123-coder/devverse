import { describe, expect, it } from 'vitest'
import { handleAssistantChatRequest } from './assistant/chat'
import { createSession, createSessionCookie, getOrCreateUser } from '../../server/auth'
import { pgliteAnalysisStore } from '../../server/store'
import { fixtureGitHubClient } from '../../github/fixture'
import { loadSnapshot } from '../../github/snapshot'
import { analyze } from '../../engine/ladder'

const NOW = new Date('2026-11-12T07:07:00.000Z')

describe('POST /api/assistant/chat route endpoint', () => {
  it('returns 401 when request is unauthenticated', async () => {
    const req = new Request('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'analyze_roadmap' }),
    })

    const res = await handleAssistantChatRequest(req)
    expect(res.status).toBe(401)
    const data = (await res.json()) as { error: string }
    expect(data.error).toBe('unauthorized')
  })

  it('returns 200 with roadmap analysis when user clicks [ Analisa lah projek ku untuk pengembangan selanjutnya ]', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_chat_endpoint_test',
      username: 'endpoint_tester',
    })

    const { token } = await createSession(user)
    const cookie = createSessionCookie(token)

    const snapshot = await loadSnapshot(
      fixtureGitHubClient('absensi-qr'),
      'rizky',
      'absensi-qr',
    )
    const analysis = analyze(snapshot, { now: NOW })
    const store = pgliteAnalysisStore()
    const savedId = await store.save(analysis, { ipHash: 'test-ip' })

    const req = new Request('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: cookie.split(';')[0],
      },
      body: JSON.stringify({
        action: 'analyze_roadmap',
        analysisId: savedId,
      }),
    })

    const res = await handleAssistantChatRequest(req, { apiKeyOverride: 'none' })
    expect(res.status).toBe(200)

    const data = (await res.json()) as { ok: boolean; reply: string }
    expect(data.ok).toBe(true)
    expect(data.reply).toContain('Analisa Pengembangan Proyek')
    expect(data.reply).toContain('Fitur')
  })
})
