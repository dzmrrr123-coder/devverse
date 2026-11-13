import { createFileRoute } from '@tanstack/react-router'
import { createSession, createSessionCookie, getOrCreateUser } from '../../../server/auth'

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

export const Route = createFileRoute('/api/auth/dev')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          body = {}
        }

        const username =
          typeof body === 'object' && body !== null && 'username' in body && typeof (body as { username: unknown }).username === 'string'
            ? (body as { username: string }).username.trim()
            : 'siswa_smk'

        const displayName =
          typeof body === 'object' && body !== null && 'displayName' in body && typeof (body as { displayName: unknown }).displayName === 'string'
            ? (body as { displayName: string }).displayName.trim()
            : 'Rizky Siswa SMK'

        const user = await getOrCreateUser({
          githubId: `dev_${username}`,
          username,
          displayName,
          avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
        })

        const { token } = await createSession(user)
        const cookie = createSessionCookie(token)

        return json(
          { ok: true, user, message: 'Login berhasil.' },
          200,
          { 'Set-Cookie': cookie },
        )
      },
    },
  },
})
