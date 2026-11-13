import { createFileRoute } from '@tanstack/react-router'
import { requireAuth, AuthError } from '../../../server/auth'
import { askAssistant } from '../../../server/assistant'
import type { QuickAction } from '../../../server/assistant'
import { pgliteAnalysisStore } from '../../../server/store'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export async function handleAssistantChatRequest(
  request: Request,
  options?: { apiKeyOverride?: string },
): Promise<Response> {
  let user
  try {
    user = await requireAuth(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return json({ error: 'unauthorized', message: err.message }, 401)
    }
    return json({ error: 'unauthorized', message: 'Sesi tidak valid.' }, 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(
      { error: 'body_tidak_valid', message: 'Body request harus berupa JSON.' },
      400,
    )
  }

  const payload = body as {
    action?: QuickAction
    prompt?: string
    analysisId?: string
  }

  let analysis = null
  if (payload.analysisId) {
    const store = pgliteAnalysisStore()
    analysis = await store.find(payload.analysisId)
  }

  try {
    const res = await askAssistant({
      userId: user.id,
      analysisId: payload.analysisId ?? null,
      analysis,
      action: payload.action,
      userPrompt: payload.prompt ?? '',
      apiKeyOverride: options?.apiKeyOverride,
    })

    return json({ ok: true, reply: res.reply }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menghubungi asisten AI.'
    return json({ error: 'assistant_error', message }, 500)
  }
}

export const Route = createFileRoute('/api/assistant/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => handleAssistantChatRequest(request),
    },
  },
})
