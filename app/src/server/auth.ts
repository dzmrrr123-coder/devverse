import { SignJWT, jwtVerify } from 'jose'
import { createHash, randomBytes } from 'node:crypto'
import { getDatabase } from './db'
import { createAnalysisId } from './store'

const DEV_SECRET = 'devverse-secret-key-32-chars-long-at-least!'

/**
 * Kunci penanda tangan sesi harus STABIL antar restart container.
 * Kalau kuncinya berubah, semua cookie lama jadi tidak valid dan pengguna
 * terlempar ke halaman login terus-menerus.
 *
 * Urutan: SESSION_SECRET -> turunan GITHUB_CLIENT_SECRET (stabil di Railway)
 * -> fallback khusus development.
 */
function resolveSecretKey(): Uint8Array {
  const explicit = process.env.SESSION_SECRET?.trim()
  if (explicit && explicit.length >= 16) {
    return new TextEncoder().encode(explicit)
  }

  const oauthSecret = process.env.GITHUB_CLIENT_SECRET?.trim()
  if (oauthSecret) {
    return new Uint8Array(
      createHash('sha256').update(`devverse.session.v1:${oauthSecret}`).digest(),
    )
  }

  return new TextEncoder().encode(DEV_SECRET)
}

const SECRET_KEY = resolveSecretKey()

export type User = {
  id: string
  githubId: string | null
  username: string
  displayName: string | null
  avatarUrl: string | null
  githubToken?: string | null
  createdAt: string
}

export type SessionPayload = {
  sessionId: string
  userId: string
  username: string
}

export class AuthError extends Error {
  readonly status: number
  constructor(message: string, status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/**
 * Verifikasi token JWT sesi menggunakan jose jwtVerify.
 * Enforces session signature in accordance with enterprise security.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    if (!payload.sub || !payload.sessionId || !payload.username) return null

    return {
      userId: payload.sub,
      sessionId: payload.sessionId as string,
      username: payload.username as string,
    }
  } catch {
    return null
  }
}

/** Alias untuk validasi token */
export async function validateToken(token: string): Promise<SessionPayload | null> {
  return verifyToken(token)
}

/**
 * Membuat sesi login baru untuk user dan menandatanganinya dengan JWT.
 */
export async function createSession(user: { id: string; username: string }): Promise<{
  sessionId: string
  token: string
}> {
  const db = await getDatabase()
  const sessionId = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 hari

  await db.query(
    'insert into sessions (id, user_id, expires_at) values ($1, $2, $3)',
    [sessionId, user.id, expiresAt],
  )

  const token = await new SignJWT({
    sessionId,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY)

  return { sessionId, token }
}

/**
 * Menghapus sesi (logout).
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDatabase()
  await db.query('delete from sessions where id = $1', [sessionId])
}

/** Membaca token sesi dari header Cookie. */
export function readSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const match = cookieHeader.match(/(?:^|;\s*)devverse_session=([^;]+)/)
  if (!match) return null

  const token = decodeURIComponent(match[1])
  return token.length > 0 ? token : null
}

type UserRow = {
  id: string
  github_id: string | null
  username: string
  display_name: string | null
  avatar_url: string | null
  github_token: string | null
  created_at: string
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    githubId: row.github_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    githubToken: row.github_token,
    createdAt: String(row.created_at),
  }
}

/**
 * Railway (dan platform container lain) mengganti filesystem setiap deploy,
 * sehingga database PGlite bisa kosong lagi sementara cookie JWT pengguna
 * masih sah 30 hari. Tanpa pemulihan ini pengguna "ter-logout" sendiri.
 *
 * Sesi yang memang dihapus lewat logout TIDAK dihidupkan kembali: kalau baris
 * user masih ada, token ditolak. Pemulihan hanya terjadi saat seluruh database
 * benar-benar hilang (baris user ikut hilang).
 */
async function rehydrateWipedSession(payload: SessionPayload): Promise<User | null> {
  const db = await getDatabase()

  const existingUser = await db.query<{ id: string }>('select id from users where id = $1', [
    payload.userId,
  ])
  if (existingUser.rows.length > 0) return null

  const username = payload.username.trim() || `siswa_${payload.userId.slice(0, 6)}`

  const inserted = await db.query<UserRow>(
    `insert into users (id, github_id, username, display_name, avatar_url)
     values ($1, null, $2, $2, null)
     on conflict (id) do update set username = excluded.username
     returning id, github_id, username, display_name, avatar_url, github_token, created_at`,
    [payload.userId, username],
  )

  await db.query(
    `insert into sessions (id, user_id, expires_at)
     values ($1, $2, now() + interval '30 days')
     on conflict (id) do nothing`,
    [payload.sessionId, payload.userId],
  )

  return inserted.rows[0] ? rowToUser(inserted.rows[0]) : null
}

/**
 * Mengambil data sesi pengguna dari Request (Header Cookie).
 * Kompatibel dengan getServerSession.
 */
export async function getServerSession(request: Request): Promise<User | null> {
  const token = readSessionToken(request)
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const db = await getDatabase()
  const res = await db.query<UserRow>(
    `select u.id, u.github_id, u.username, u.display_name, u.avatar_url, u.github_token, u.created_at
     from sessions s
     join users u on u.id = s.user_id
     where s.id = $1 and s.expires_at > now()`,
    [payload.sessionId],
  )

  if (res.rows.length === 0) {
    return rehydrateWipedSession(payload)
  }

  return rowToUser(res.rows[0])
}

/**
 * Memastikan request terotentikasi di sisi server.
 */
export async function requireAuth(request: Request): Promise<User> {
  const user = await getServerSession(request)
  if (!user) {
    throw new AuthError('Autentikasi dibutuhkan. Silakan login terlebih dahulu.', 401)
  }
  return user
}

/**
 * Membuat atau memperbarui data pengguna GitHub.
 */
export async function getOrCreateUser(profile: {
  githubId: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  githubToken?: string | null
}): Promise<User> {
  const db = await getDatabase()
  const normalizedGithubId = profile.githubId.trim().toLowerCase()

  // Setelah database kosong dan sesi dipulihkan, baris user hasil pemulihan
  // belum punya github_id. Kalau pengguna login GitHub lagi, pakai baris itu
  // supaya id-nya tetap sama (riwayat & sesi lama tidak putus).
  const byGithubId = await db.query<{ id: string }>(
    'select id from users where github_id = $1 limit 1',
    [normalizedGithubId],
  )

  let existingId = byGithubId.rows[0]?.id
  if (!existingId) {
    const byUsername = await db.query<{ id: string }>(
      'select id from users where github_id is null and lower(username) = lower($1) limit 1',
      [profile.username],
    )
    existingId = byUsername.rows[0]?.id
  }

  if (existingId) {
    const updated = await db.query<UserRow>(
      `update users set
         github_id = $1,
         username = $2,
         display_name = coalesce($3, display_name),
         avatar_url = coalesce($4, avatar_url),
         github_token = coalesce($5, github_token)
       where id = $6
       returning id, github_id, username, display_name, avatar_url, github_token, created_at`,
      [
        normalizedGithubId,
        profile.username,
        profile.displayName ?? null,
        profile.avatarUrl ?? null,
        profile.githubToken ?? null,
        existingId,
      ],
    )
    if (updated.rows[0]) return rowToUser(updated.rows[0])
  }

  const userId = createAnalysisId()

  const res = await db.query<UserRow>(
    `insert into users (id, github_id, username, display_name, avatar_url, github_token)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (github_id) do update set
       username = excluded.username,
       display_name = coalesce(excluded.display_name, users.display_name),
       avatar_url = coalesce(excluded.avatar_url, users.avatar_url),
       github_token = coalesce(excluded.github_token, users.github_token)
     returning id, github_id, username, display_name, avatar_url, github_token, created_at`,
    [
      userId,
      normalizedGithubId,
      profile.username,
      profile.displayName ?? null,
      profile.avatarUrl ?? null,
      profile.githubToken ?? null,
    ],
  )

  return rowToUser(res.rows[0])
}

/** True saat request datang lewat HTTPS (Railway memakai proxy). */
export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-proto')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() === 'https'
  }
  try {
    return new URL(request.url).protocol === 'https:'
  } catch {
    return process.env.NODE_ENV === 'production'
  }
}

export function createSessionCookie(token: string, options?: { secure?: boolean }): string {
  const maxAge = 30 * 24 * 60 * 60 // 30 hari
  const secure = options?.secure ?? process.env.NODE_ENV === 'production'
  const parts = [
    `devverse_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function createClearSessionCookie(): string {
  return 'devverse_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}

/** Mencabut sesi di database saat logout (cookie saja tidak cukup). */
export async function revokeSessionFromRequest(request: Request): Promise<void> {
  const token = readSessionToken(request)
  if (!token) return

  const payload = await verifyToken(token)
  if (!payload) return

  await deleteSession(payload.sessionId)
}

export function createPendingClaimCookie(analysisId: string): string {
  const maxAge = 2 * 60 * 60 // 2 jam
  return `devverse_pending_claim=${encodeURIComponent(analysisId)}; Path=/; SameSite=Lax; Max-Age=${maxAge}`
}

export function createClearPendingClaimCookie(): string {
  return 'devverse_pending_claim=; Path=/; SameSite=Lax; Max-Age=0'
}

/**
 * Mengklaim analisis yang dilakukan secara anonim saat pengguna melakukan login.
 * Menghubungkan analisis anonim terakhir ke akun baru dan membersihkan cookie klaim.
 */
export async function claimPendingAnalysis(
  request: Request,
  userId: string,
): Promise<{ claimedId: string | null; clearCookie: string | null }> {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return { claimedId: null, clearCookie: null }

  const match = cookieHeader.match(/(?:^|;\s*)devverse_pending_claim=([^;]+)/)
  if (!match) return { claimedId: null, clearCookie: null }

  const pendingId = decodeURIComponent(match[1]).trim()
  if (!/^[0-9A-Za-z]{12}$/.test(pendingId)) {
    return { claimedId: null, clearCookie: createClearPendingClaimCookie() }
  }

  const db = await getDatabase()
  const exists = await db.query<{ id: string }>('select id from analysis where id = $1', [pendingId])
  if (exists.rows.length === 0) {
    return { claimedId: null, clearCookie: createClearPendingClaimCookie() }
  }

  const savedId = createAnalysisId()
  await db.query(
    `insert into saved_projects (id, user_id, analysis_id)
     values ($1, $2, $3)
     on conflict (user_id, analysis_id) do nothing`,
    [savedId, userId, pendingId],
  )

  return {
    claimedId: pendingId,
    clearCookie: createClearPendingClaimCookie(),
  }
}
