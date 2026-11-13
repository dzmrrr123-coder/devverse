import { SignJWT, jwtVerify } from 'jose'
import { randomBytes } from 'node:crypto'
import { getDatabase } from './db'
import { createAnalysisId } from './store'

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'devverse-secret-key-32-chars-long-at-least!',
)

export type User = {
  id: string
  githubId: string | null
  username: string
  displayName: string | null
  avatarUrl: string | null
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

/**
 * Mengambil data sesi pengguna dari Request (Header Cookie).
 * Kompatibel dengan getServerSession.
 */
export async function getServerSession(request: Request): Promise<User | null> {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const match = cookieHeader.match(/(?:^|;\s*)devverse_session=([^;]+)/)
  if (!match) return null

  const token = decodeURIComponent(match[1])
  const payload = await verifyToken(token)
  if (!payload) return null

  const db = await getDatabase()
  const res = await db.query<{
    id: string
    github_id: string | null
    username: string
    display_name: string | null
    avatar_url: string | null
    created_at: string
  }>(
    `select u.id, u.github_id, u.username, u.display_name, u.avatar_url, u.created_at
     from sessions s
     join users u on u.id = s.user_id
     where s.id = $1 and s.expires_at > now()`,
    [payload.sessionId],
  )

  if (res.rows.length === 0) return null

  const row = res.rows[0]
  return {
    id: row.id,
    githubId: row.github_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  }
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
}): Promise<User> {
  const db = await getDatabase()
  const existing = await db.query<{
    id: string
    github_id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    created_at: string
  }>('select * from users where github_id = $1', [profile.githubId])

  if (existing.rows.length > 0) {
    const row = existing.rows[0]
    await db.query(
      'update users set username = $1, display_name = $2, avatar_url = $3 where id = $4',
      [profile.username, profile.displayName ?? null, profile.avatarUrl ?? null, row.id],
    )
    return {
      id: row.id,
      githubId: row.github_id,
      username: profile.username,
      displayName: profile.displayName ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      createdAt: row.created_at,
    }
  }

  const userId = createAnalysisId()
  await db.query(
    `insert into users (id, github_id, username, display_name, avatar_url)
     values ($1, $2, $3, $4, $5)`,
    [userId, profile.githubId, profile.username, profile.displayName ?? null, profile.avatarUrl ?? null],
  )

  return {
    id: userId,
    githubId: profile.githubId,
    username: profile.username,
    displayName: profile.displayName ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    createdAt: new Date().toISOString(),
  }
}

export function createSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === 'production'
  const maxAge = 30 * 24 * 60 * 60 // 30 hari
  return `devverse_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
    isProd ? '; Secure' : ''
  }`
}

export function createClearSessionCookie(): string {
  return 'devverse_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}
