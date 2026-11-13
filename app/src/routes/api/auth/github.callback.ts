import { createFileRoute } from '@tanstack/react-router'
import {
  createSession,
  createSessionCookie,
  getOrCreateUser,
  claimPendingAnalysis,
} from '../../../server/auth'

export const Route = createFileRoute('/api/auth/github/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const host = request.headers.get('host') || url.host
        const proto = request.headers.get('x-forwarded-proto') || 'https'
        const baseUrl = `${proto}://${host}`

        if (!code) {
          return Response.redirect(`${baseUrl}/login?error=no_code`, 302)
        }

        const clientId = process.env.GITHUB_CLIENT_ID
        const clientSecret = process.env.GITHUB_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          return Response.redirect(`${baseUrl}/login?error=oauth_not_configured`, 302)
        }

        try {
          // Tukar authorization code dengan access token
          const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              accept: 'application/json',
            },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              code,
            }),
          })

          const tokenData = (await tokenRes.json()) as {
            access_token?: string
            error?: string
            error_description?: string
          }

          if (!tokenData.access_token) {
            console.error('GitHub token exchange gagal:', tokenData)
            return Response.redirect(`${baseUrl}/login?error=token_failed`, 302)
          }

          const accessToken = tokenData.access_token

          // Ambil profil akun GitHub pengguna
          const userRes = await fetch('https://api.github.com/user', {
            headers: {
              authorization: `Bearer ${accessToken}`,
              accept: 'application/vnd.github.v3+json',
              'user-agent': 'Devverse-App',
            },
          })

          if (!userRes.ok) {
            return Response.redirect(`${baseUrl}/login?error=user_fetch_failed`, 302)
          }

          const gitUser = (await userRes.json()) as {
            id: number
            login: string
            name?: string | null
            avatar_url?: string | null
          }

          // Buat atau perbarui akun siswa di database
          const user = await getOrCreateUser({
            githubId: String(gitUser.id),
            username: gitUser.login,
            displayName: gitUser.name ?? gitUser.login,
            avatarUrl: gitUser.avatar_url ?? null,
            githubToken: accessToken,
          })

          // Buat sesi JWT
          const { token: sessionJwt } = await createSession(user)
          const sessionCookie = createSessionCookie(sessionJwt)

          // Klaim otomatis analisis anonim terakhir jika ada
          const { clearCookie } = await claimPendingAnalysis(request, user.id)

          const headers = new Headers({
            location: `${baseUrl}/dashboard`,
          })
          headers.append('Set-Cookie', sessionCookie)
          if (clearCookie) {
            headers.append('Set-Cookie', clearCookie)
          }

          return new Response(null, { status: 302, headers })
        } catch (err) {
          console.error('OAuth callback error:', err)
          return Response.redirect(`${baseUrl}/login?error=oauth_error`, 302)
        }
      },
    },
  },
})
