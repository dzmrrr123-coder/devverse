import { createFileRoute } from '@tanstack/react-router'
import {
  createSession,
  createSessionCookie,
  getOrCreateUser,
  claimPendingAnalysis,
  isSecureRequest,
} from '../../../server/auth'

export const Route = createFileRoute('/api/auth/github/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        const errorDesc = url.searchParams.get('error_description')

        if (error) {
          console.error('GitHub OAuth mengembalikan error:', error, errorDesc)
          return new Response(null, {
            status: 302,
            headers: { location: `/login?error=${encodeURIComponent(error)}` },
          })
        }

        if (!code) {
          return new Response(null, {
            status: 302,
            headers: { location: '/login?error=no_code' },
          })
        }

        const clientId = process.env.GITHUB_CLIENT_ID
        const clientSecret = process.env.GITHUB_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          return new Response(null, {
            status: 302,
            headers: { location: '/login?error=oauth_not_configured' },
          })
        }

        try {
          // Tukar authorization code dengan access token
          const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              accept: 'application/json',
              'user-agent': 'Devverse-App',
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
            const errCode = tokenData.error || 'token_failed'
            return new Response(null, {
              status: 302,
              headers: { location: `/login?error=${encodeURIComponent(errCode)}` },
            })
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
            console.error('Ambil profil GitHub gagal:', userRes.status, await userRes.text())
            return new Response(null, {
              status: 302,
              headers: { location: '/login?error=user_fetch_failed' },
            })
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
          const sessionCookie = createSessionCookie(sessionJwt, {
            secure: isSecureRequest(request),
          })

          // Klaim otomatis analisis anonim terakhir jika ada
          const { clearCookie } = await claimPendingAnalysis(request, user.id)

          const headers = new Headers({
            location: '/dashboard',
          })
          headers.append('Set-Cookie', sessionCookie)
          if (clearCookie) {
            headers.append('Set-Cookie', clearCookie)
          }

          return new Response(null, { status: 302, headers })
        } catch (err) {
          console.error('OAuth callback exception:', err)
          return new Response(null, {
            status: 302,
            headers: { location: '/login?error=oauth_error' },
          })
        }
      },
    },
  },
})
