import { describe, expect, it } from 'vitest'
import { fixtureGitHubClient } from '../../github/fixture'
import { GitHubError } from '../../github/types'
import type { GitHubClient } from '../../github/types'
import type { Analysis } from '../../engine/types'
import { createAnalysisId } from '../../server/store'
import type { AnalysisStore } from '../../server/store'
import { handleAnalyzeRequest } from './analyze'

const NOW = new Date('2026-11-12T07:07:00.000Z')

function memoryStore(): AnalysisStore & { rows: Map<string, Analysis> } {
  const rows = new Map<string, Analysis>()
  return {
    rows,
    async save(analysis) {
      const id = createAnalysisId()
      rows.set(id, structuredClone(analysis))
      return id
    },
    async find(id) {
      const row = rows.get(id)
      return row ? structuredClone(row) : null
    },
  }
}

function postRequest(body: unknown, contentType = 'application/json'): Request {
  return new Request('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/analyze route handler', () => {
  it('returns 201 with analysis id and url for a valid GitHub repo', async () => {
    const store = memoryStore()
    const client = fixtureGitHubClient('absensi-qr')

    const req = postRequest({ url: 'https://github.com/rizkyfajar/absensi-qr' })
    const res = await handleAnalyzeRequest(req, {
      client,
      store,
      now: () => NOW,
    })

    expect(res.status).toBe(201)
    const data = (await res.json()) as { id: string; url: string }
    expect(data.id).toMatch(/^[0-9A-Za-z]{12}$/)
    expect(data.url).toBe(`/r/${data.id}`)

    const stored = await store.find(data.id)
    expect(stored).not.toBeNull()
    expect(stored?.reachedLevel).toBe(2)
    expect(stored?.frontierLevel).toBe(3)
  })

  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json{{{',
    })

    const res = await handleAnalyzeRequest(req)
    expect(res.status).toBe(400)
    const data = (await res.json()) as { error: string }
    expect(data.error).toBe('body_tidak_valid')
  })

  it('returns 400 when url is missing or empty', async () => {
    const req = postRequest({ url: '   ' })
    const res = await handleAnalyzeRequest(req)

    expect(res.status).toBe(400)
    const data = (await res.json()) as { error: string }
    expect(data.error).toBe('url_tidak_valid')
  })

  it('returns 400 when url is not a valid GitHub repo URL', async () => {
    const req = postRequest({ url: 'https://gitlab.com/user/project' })
    const res = await handleAnalyzeRequest(req)

    expect(res.status).toBe(400)
    const data = (await res.json()) as { error: string }
    expect(data.error).toBe('url_tidak_valid')
  })

  it('returns 404 when repository is not found or private', async () => {
    const store = memoryStore()
    const failingClient: GitHubClient = {
      async getRepo() {
        throw new GitHubError('not_found', 'Repository tidak ditemukan di GitHub.', 404)
      },
      async getTree() {
        throw new GitHubError('not_found', 'Repository tidak ditemukan.', 404)
      },
      async getCommits() {
        return { ok: false, reason: 'mock' }
      },
      async getCiRuns() {
        return { ok: false, reason: 'mock' }
      },
      async getReadme() {
        return null
      },
    }

    const req = postRequest({ url: 'https://github.com/privat/rahasia' })
    const res = await handleAnalyzeRequest(req, { client: failingClient, store })

    expect(res.status).toBe(404)
    const data = (await res.json()) as { error: string; message: string }
    expect(data.error).toBe('repo_tidak_ditemukan')
    expect(data.message).toContain('tidak ditemukan')
  })

  it('returns 429 when GitHub rate limit is exceeded', async () => {
    const store = memoryStore()
    const rateLimitedClient: GitHubClient = {
      async getRepo() {
        throw new GitHubError('rate_limited', 'Batas laju tercapai.', 429, '2026-11-13T10:00:00Z')
      },
      async getTree() {
        throw new Error('should not be called')
      },
      async getCommits() {
        return { ok: false, reason: 'mock' }
      },
      async getCiRuns() {
        return { ok: false, reason: 'mock' }
      },
      async getReadme() {
        return null
      },
    }

    const req = postRequest({ url: 'https://github.com/populer/banyak-bintang' })
    const res = await handleAnalyzeRequest(req, { client: rateLimitedClient, store })

    expect(res.status).toBe(429)
    const data = (await res.json()) as { error: string; resetAt?: string }
    expect(data.error).toBe('batas_laju')
    expect(data.resetAt).toBe('2026-11-13T10:00:00Z')
  })

  it('returns 502 when GitHub network fails', async () => {
    const store = memoryStore()
    const networkErrorClient: GitHubClient = {
      async getRepo() {
        throw new GitHubError('upstream', 'GitHub sedang tidak bisa dihubungi.', 502)
      },
      async getTree() {
        throw new Error('should not be called')
      },
      async getCommits() {
        return { ok: false, reason: 'mock' }
      },
      async getCiRuns() {
        return { ok: false, reason: 'mock' }
      },
      async getReadme() {
        return null
      },
    }

    const req = postRequest({ url: 'https://github.com/down/repo' })
    const res = await handleAnalyzeRequest(req, { client: networkErrorClient, store })

    expect(res.status).toBe(502)
    const data = (await res.json()) as { error: string }
    expect(data.error).toBe('github_tidak_bisa_dihubungi')
  })
})
