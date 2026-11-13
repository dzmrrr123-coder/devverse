import { createFileRoute } from '@tanstack/react-router'
import { getDatabase } from '../../../server/db'
import { pgliteAnalysisStore } from '../../../server/store'
import { buildTimeline } from '../../../engine/timeline'
import type { Analysis } from '../../../engine/types'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export const Route = createFileRoute('/api/projects/timeline')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const owner = url.searchParams.get('owner')
        const repo = url.searchParams.get('repo')

        if (!owner || !repo) {
          return json({ error: 'param_missing', message: 'owner dan repo dibutuhkan' }, 400)
        }

        try {
          const db = await getDatabase()
          const store = pgliteAnalysisStore()

          const rows = await db.query<{ id: string }>(
            `select id from analysis
             where lower(owner) = lower($1) and lower(repo) = lower($2)
             order by created_at asc`,
            [owner, repo],
          )

          const items: Array<{ id: string; analysis: Analysis }> = []
          for (const row of rows.rows) {
            const a = await store.find(row.id)
            if (a) items.push({ id: row.id, analysis: a })
          }

          const timeline = buildTimeline(items)
          return json({ ok: true, timeline }, 200)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal memuat timeline'
          return json({ error: 'server_error', message }, 500)
        }
      },
    },
  },
})
