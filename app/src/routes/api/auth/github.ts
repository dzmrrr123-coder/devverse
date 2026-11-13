import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/github')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.GITHUB_CLIENT_ID
        const url = new URL(request.url)
        const host = request.headers.get('host') || url.host
        const proto = request.headers.get('x-forwarded-proto') || 'https'
        const redirectUri = `${proto}://${host}/api/auth/github/callback`

        if (!clientId) {
          // Jika OAuth belum dikonfigurasi di environment variables, arahkan kembali dengan pesan
          return Response.redirect(`${proto}://${host}/login?error=oauth_not_configured`, 302)
        }

        const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
          clientId,
        )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user,repo`

        return Response.redirect(authUrl, 302)
      },
    },
  },
})
