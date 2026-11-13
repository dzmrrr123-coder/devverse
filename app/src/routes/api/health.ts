import { createFileRoute } from '@tanstack/react-router'
import { readAppHealth } from '../../server/db'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const health = await readAppHealth()
          return json({
            ok: true,
            commit: process.env.RAILWAY_GIT_COMMIT_SHA ?? 'local',
            engineVersion: health.engineVersion,
            database: health.databaseVersion,
            // 'ephemeral' = data hilang tiap deploy, 'volume' = tersimpan permanen
            storage: process.env.RAILWAY_VOLUME_MOUNT_PATH ? 'volume' : 'ephemeral',
          })
        } catch {
          return json({ ok: false, message: 'Database belum siap.' }, 503)
        }
      },
    },
  },
})
