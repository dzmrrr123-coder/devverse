import { createFileRoute } from '@tanstack/react-router'
import { createClearSessionCookie, revokeSessionFromRequest } from '../../../server/auth'

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Hapus sesi di server juga, bukan cuma cookie di peramban.
        try {
          await revokeSessionFromRequest(request)
        } catch (err) {
          console.error('Gagal mencabut sesi saat logout:', err)
        }

        const cookie = createClearSessionCookie()
        return json(
          { ok: true, message: 'Logout berhasil.' },
          200,
          { 'Set-Cookie': cookie },
        )
      },
    },
  },
})
