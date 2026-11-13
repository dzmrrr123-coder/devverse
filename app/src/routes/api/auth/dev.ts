import { createFileRoute } from '@tanstack/react-router'
import {
  createSession,
  createSessionCookie,
  getOrCreateUser,
  claimPendingAnalysis,
} from '../../../server/auth'

export const Route = createFileRoute('/api/auth/dev')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Larang dev login di environment production agar tidak ada yang bisa masuk sembarangan
        if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_LOGIN) {
          return new Response(
            JSON.stringify({
              error: 'forbidden',
              message: 'Login acak dimatikan. Wajib menggunakan otorisasi GitHub OAuth resmi.',
            }),
            {
              status: 403,
              headers: { 'content-type': 'application/json; charset=utf-8' },
            },
          )
        }

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
        const sessionCookie = createSessionCookie(token)

        const { claimedId, clearCookie } = await claimPendingAnalysis(request, user.id)

        const headers = new Headers({
          'content-type': 'application/json; charset=utf-8',
        })
        headers.append('Set-Cookie', sessionCookie)
        if (clearCookie) {
          headers.append('Set-Cookie', clearCookie)
        }

        return new Response(
          JSON.stringify({
            ok: true,
            user,
            claimedId,
            message: 'Login berhasil.',
          }),
          { status: 200, headers },
        )
      },
    },
  },
})
