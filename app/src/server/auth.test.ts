import { describe, expect, it } from 'vitest'
import {
  createSession,
  verifyToken,
  validateToken,
  getServerSession,
  requireAuth,
  deleteSession,
  getOrCreateUser,
  createSessionCookie,
} from './auth'

describe('server auth module', () => {
  it('creates and verifies signed JWT session tokens', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_test_123',
      username: 'budi_smk',
      displayName: 'Budi Santoso',
    })

    const { sessionId, token } = await createSession(user)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)

    const payload = await verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe(user.id)
    expect(payload?.sessionId).toBe(sessionId)
    expect(payload?.username).toBe('budi_smk')

    // validateToken alias
    const validated = await validateToken(token)
    expect(validated?.userId).toBe(user.id)
  })

  it('rejects invalid or tampered tokens', async () => {
    const invalid = await verifyToken('not.a.real.jwt.token')
    expect(invalid).toBeNull()
  })

  it('retrieves user from request cookie via getServerSession', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_test_456',
      username: 'ani_rpl',
      displayName: 'Ani RPL',
    })

    const { token } = await createSession(user)
    const cookie = createSessionCookie(token)

    const req = new Request('http://localhost:3000/dashboard', {
      headers: { cookie: cookie.split(';')[0] },
    })

    const sessionUser = await getServerSession(req)
    expect(sessionUser).not.toBeNull()
    expect(sessionUser?.id).toBe(user.id)
    expect(sessionUser?.username).toBe('ani_rpl')

    // requireAuth succeeds
    const authed = await requireAuth(req)
    expect(authed.id).toBe(user.id)
  })

  it('throws AuthError in requireAuth when no cookie is sent', async () => {
    const req = new Request('http://localhost:3000/dashboard')
    await expect(requireAuth(req)).rejects.toThrow('Autentikasi dibutuhkan')
  })

  it('deletes session upon logout', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_test_789',
      username: 'logout_test',
    })

    const { sessionId, token } = await createSession(user)
    await deleteSession(sessionId)

    const req = new Request('http://localhost:3000/dashboard', {
      headers: { cookie: createSessionCookie(token).split(';')[0] },
    })

    const sessionUser = await getServerSession(req)
    expect(sessionUser).toBeNull()
  })

  it('menandai cookie Secure hanya untuk request HTTPS', async () => {
    const { isSecureRequest } = await import('./auth')

    expect(createSessionCookie('token', { secure: true })).toContain('Secure')
    expect(createSessionCookie('token', { secure: false })).not.toContain('Secure')

    const httpsReq = new Request('http://internal:3000/dashboard', {
      headers: { 'x-forwarded-proto': 'https' },
    })
    const httpReq = new Request('http://localhost:3000/dashboard')
    expect(isSecureRequest(httpsReq)).toBe(true)
    expect(isSecureRequest(httpReq)).toBe(false)
  })

  it('memulihkan sesi setelah database hilang (container baru)', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_wipe_1',
      username: 'wipe_user',
      displayName: 'Wipe User',
    })

    const { token } = await createSession(user)
    const { getDatabase } = await import('./db')
    const db = await getDatabase()

    // Simulasi deploy Railway: seluruh baris user + sesi hilang.
    await db.query('delete from users where id = $1', [user.id])

    const req = new Request('http://localhost:3000/dashboard', {
      headers: { cookie: createSessionCookie(token, { secure: false }).split(';')[0] },
    })

    const restored = await getServerSession(req)
    expect(restored).not.toBeNull()
    expect(restored?.id).toBe(user.id)
    expect(restored?.username).toBe('wipe_user')

    const sessionRow = await db.query<{ id: string }>(
      'select id from sessions where user_id = $1',
      [user.id],
    )
    expect(sessionRow.rows.length).toBe(1)
  })

  it('login GitHub setelah pemulihan memakai id user yang sama', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_wipe_2',
      username: 'wipe_user2',
    })

    const { token } = await createSession(user)
    const { getDatabase } = await import('./db')
    const db = await getDatabase()
    await db.query('delete from users where id = $1', [user.id])

    const req = new Request('http://localhost:3000/dashboard', {
      headers: { cookie: `devverse_session=${encodeURIComponent(token)}` },
    })
    await getServerSession(req)

    const relogin = await getOrCreateUser({
      githubId: 'gh_wipe_2',
      username: 'wipe_user2',
      displayName: 'Wipe Two',
    })
    expect(relogin.id).toBe(user.id)
    expect(relogin.githubId).toBe('gh_wipe_2')
  })

  it('claims an anonymous analysis upon login and prevents claiming it twice', async () => {
    const user = await getOrCreateUser({
      githubId: 'gh_claim_test',
      username: 'claim_user',
    })

    const { pgliteAnalysisStore } = await import('./store')
    const { fixtureGitHubClient } = await import('../github/fixture')
    const { loadSnapshot } = await import('../github/snapshot')
    const { analyze } = await import('../engine/ladder')
    const { createPendingClaimCookie, claimPendingAnalysis } = await import('./auth')

    const snap = await loadSnapshot(fixtureGitHubClient('absensi-qr'), 'siswa', 'absensi')
    const analysis = analyze(snap, { now: new Date() })
    const store = pgliteAnalysisStore()
    const analysisId = await store.save(analysis, { ipHash: 'test-hash' })

    const claimCookie = createPendingClaimCookie(analysisId)

    // Request 1: Login with claim cookie
    const req1 = new Request('http://localhost:3000/api/auth/dev', {
      headers: { cookie: claimCookie.split(';')[0] },
    })

    const claimResult = await claimPendingAnalysis(req1, user.id)
    expect(claimResult.claimedId).toBe(analysisId)
    expect(claimResult.clearCookie).toContain('Max-Age=0')

    // Request 2: Try to claim again with cleared cookie
    const req2 = new Request('http://localhost:3000/api/auth/dev', {
      headers: { cookie: claimResult.clearCookie?.split(';')[0] ?? '' },
    })

    const secondClaim = await claimPendingAnalysis(req2, user.id)
    expect(secondClaim.claimedId).toBeNull()
  })
})
