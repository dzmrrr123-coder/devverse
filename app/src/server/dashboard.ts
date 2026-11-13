import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getDatabase } from './db'
import { getServerSession } from './auth'
import type { User } from './auth'
import { getConversationHistory } from './assistant'

export type SavedProjectItem = {
  id: string
  analysisId: string
  repoFullName: string
  repoUrl: string
  reachedLevel: number | null
  frontierLevel: number | null
  analyzedAt: string
  savedAt: string
}

export type DashboardData = {
  user: User
  projects: SavedProjectItem[]
  recentChats: Array<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: string }>
}

const authContextMiddleware = createMiddleware().server(async ({ next, request }) => {
  return next({ context: { request } })
})

export const getDashboardData = createServerFn({ method: 'GET' })
  .middleware([authContextMiddleware])
  .handler(async ({ context }): Promise<DashboardData | null> => {
    const user = await getServerSession(context.request)
    if (!user) return null

    const db = await getDatabase()
    const projectsRes = await db.query<{
      id: string
      analysis_id: string
      full_name: string
      repo_url: string
      reached_level: number | null
      frontier_level: number | null
      analyzed_at: string
      created_at: string
    }>(
      `select sp.id, sp.analysis_id, a.full_name, a.repo_url, a.reached_level, a.frontier_level, a.created_at as analyzed_at, sp.created_at
       from saved_projects sp
       join analysis a on a.id = sp.analysis_id
       where sp.user_id = $1
       order by sp.created_at desc`,
      [user.id],
    )

    const projects: SavedProjectItem[] = projectsRes.rows.map((r) => ({
      id: r.id,
      analysisId: r.analysis_id,
      repoFullName: r.full_name,
      repoUrl: r.repo_url,
      reachedLevel: r.reached_level,
      frontierLevel: r.frontier_level,
      analyzedAt: r.analyzed_at,
      savedAt: r.created_at,
    }))

    const recentChats = await getConversationHistory(user.id)

    return {
      user,
      projects,
      recentChats,
    }
  })

export async function saveProjectForUser(userId: string, analysisId: string): Promise<void> {
  const db = await getDatabase()
  const { createAnalysisId } = await import('./store')
  const id = createAnalysisId()

  await db.query(
    `insert into saved_projects (id, user_id, analysis_id)
     values ($1, $2, $3)
     on conflict (user_id, analysis_id) do nothing`,
    [id, userId, analysisId],
  )
}
