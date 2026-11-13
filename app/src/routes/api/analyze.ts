import { createFileRoute } from '@tanstack/react-router'
import { GitHubError } from '../../github/types'
import type { GitHubClient } from '../../github/types'
import type { AnalysisStore } from '../../server/store'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export type AnalyzeHandlerDeps = {
  client?: GitHubClient
  store?: AnalysisStore
  now?: () => Date
}

export async function handleAnalyzeRequest(
  request: Request,
  deps?: AnalyzeHandlerDeps,
): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(
      { error: 'body_tidak_valid', message: 'Body request harus berupa JSON.' },
      400,
    )
  }

  const url =
    typeof body === 'object' && body !== null && 'url' in body ? body.url : null

  if (typeof url !== 'string' || url.trim().length === 0) {
    return json(
      {
        error: 'url_tidak_valid',
        message: 'Tempel URL repository GitHub terlebih dahulu.',
      },
      400,
    )
  }

  const [{ analyzeRepository, AnalyzeError }, { pgliteAnalysisStore }, { hashIp }, { liveGitHubClient }] =
    await Promise.all([
      import('../../server/analyze'),
      import('../../server/store'),
      import('../../server/ip'),
      import('../../github/live'),
    ])

  const client = deps?.client ?? liveGitHubClient()
  const store = deps?.store ?? pgliteAnalysisStore()
  const now = deps?.now

  try {
    const result = await analyzeRepository(
      { url, ipHash: hashIp(request) },
      { client, store, now },
    )
    return json({ id: result.id, url: `/r/${result.id}` }, 201)
  } catch (error) {
    if (error instanceof AnalyzeError) {
      return json({ error: error.code, message: error.message }, 400)
    }

    if (error instanceof GitHubError) {
      if (error.kind === 'not_found') {
        return json({ error: 'repo_tidak_ditemukan', message: error.message }, 404)
      }
      if (error.kind === 'rate_limited') {
        return json(
          { error: 'batas_laju', message: error.message, resetAt: error.resetAt },
          429,
        )
      }
      return json({ error: 'github_tidak_bisa_dihubungi', message: error.message }, 502)
    }

    console.error('analisis gagal', error)
    return json(
      {
        error: 'gagal_menganalisis',
        message: 'Analisis gagal di tengah jalan. Coba lagi sebentar lagi.',
      },
      500,
    )
  }
}

export const Route = createFileRoute('/api/analyze')({
  server: {
    handlers: {
      POST: async ({ request }) => handleAnalyzeRequest(request),
    },
  },
})
