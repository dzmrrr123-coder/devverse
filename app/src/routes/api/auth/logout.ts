import { createFileRoute } from '@tanstack/react-router'
import { createClearSessionCookie } from '../../../server/auth'

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
      POST: async () => {
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
