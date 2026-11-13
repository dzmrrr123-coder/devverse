import { createFileRoute } from '@tanstack/react-router'
import { getDatabase } from '../../server/db'
import { generateBadgeSvg } from '../../engine/badge'

export const Route = createFileRoute('/api/badge/$owner/$repo')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const owner = params.owner
        const repo = params.repo

        let reachedLevel: number | null = null

        try {
          const db = await getDatabase()
          const res = await db.query<{ reached_level: number | null }>(
            `select reached_level from analysis
             where lower(owner) = lower($1) and lower(repo) = lower($2)
             order by created_at desc
             limit 1`,
            [owner, repo],
          )

          if (res.rows.length > 0) {
            reachedLevel = res.rows[0].reached_level
          }
        } catch (err) {
          console.warn('Gagal membaca badge level dari database:', err)
        }

        const svg = generateBadgeSvg({ level: reachedLevel })

        return new Response(svg, {
          status: 200,
          headers: {
            'content-type': 'image/svg+xml; charset=utf-8',
            'cache-control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
          },
        })
      },
    },
  },
})
