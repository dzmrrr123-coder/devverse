import { GitHubError } from './types'
import type {
  CiRunsResult,
  CommitsResult,
  GitHubClient,
  GitHubCommitResponse,
  GitHubReadmeResponse,
  GitHubRepoResponse,
  GitHubTreeResponse,
  GitHubWorkflowRunsResponse,
} from './types'

const API = 'https://api.github.com'

function requestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'devverse',
  }

  // Token hanya hidup di server. Nilainya dibaca saat request, bukan saat modul
  // dimuat, supaya tidak pernah ikut ke bundle browser.
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function rateLimitResetAt(response: Response): string | null {
  const retryAfter = response.headers.get('retry-after')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds)) {
      return new Date(Date.now() + seconds * 1000).toISOString()
    }
  }

  const reset = response.headers.get('x-ratelimit-reset')
  if (reset) {
    const seconds = Number(reset)
    if (Number.isFinite(seconds)) {
      return new Date(seconds * 1000).toISOString()
    }
  }

  return null
}

function isRateLimited(response: Response): boolean {
  if (response.status === 429) return true
  if (response.status !== 403) return false
  return (
    response.headers.get('x-ratelimit-remaining') === '0' ||
    response.headers.has('retry-after')
  )
}

function rateLimitedError(response: Response): GitHubError {
  const resetAt = rateLimitResetAt(response)
  return new GitHubError(
    'rate_limited',
    'Batas permintaan ke GitHub tercapai. Coba lagi beberapa menit lagi.',
    429,
    resetAt,
  )
}

function upstreamError(status: number): GitHubError {
  return new GitHubError(
    'upstream',
    `GitHub tidak bisa dihubungi saat ini (HTTP ${status}). Coba lagi sebentar lagi.`,
    502,
    null,
  )
}

/** Kalimat yang sama dengan yang dibaca siswa di laporan. */
function rateLimitedReason(response: Response): string {
  const resetAt = rateLimitResetAt(response)
  const suffix = resetAt
    ? ` - coba lagi setelah ${new Date(resetAt).toLocaleTimeString('id-ID')}`
    : ' - coba lagi beberapa menit lagi'
  return `batas API GitHub 60/jam${suffix}`
}

async function get(path: string): Promise<Response> {
  return fetch(`${API}${path}`, { headers: requestHeaders() })
}

export function liveGitHubClient(): GitHubClient {
  return {
    async getRepo(owner, repo): Promise<GitHubRepoResponse> {
      const response = await get(`/repos/${owner}/${repo}`)
      if (response.status === 404) {
        throw new GitHubError(
          'not_found',
          'Repository tidak ditemukan, atau repository-nya privat.',
          404,
          null,
        )
      }
      if (isRateLimited(response)) throw rateLimitedError(response)
      if (!response.ok) throw upstreamError(response.status)
      return (await response.json()) as GitHubRepoResponse
    },

    async getReadme(owner, repo): Promise<GitHubReadmeResponse> {
      const response = await get(`/repos/${owner}/${repo}/readme`)
      if (response.status === 404) return null
      if (isRateLimited(response)) throw rateLimitedError(response)
      if (!response.ok) throw upstreamError(response.status)
      return (await response.json()) as GitHubReadmeResponse
    },

    async getTree(owner, repo, ref): Promise<GitHubTreeResponse> {
      const response = await get(
        `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
      )
      if (response.status === 404 || response.status === 409) {
        return { sha: ref, truncated: false, tree: [] }
      }
      if (isRateLimited(response)) throw rateLimitedError(response)
      if (!response.ok) throw upstreamError(response.status)
      return (await response.json()) as GitHubTreeResponse
    },

    async getCommits(owner, repo): Promise<CommitsResult> {
      const response = await get(`/repos/${owner}/${repo}/commits?per_page=20`)
      if (response.status === 404 || response.status === 409) {
        return { ok: true, commits: [] }
      }
      if (isRateLimited(response)) {
        return { ok: false, reason: rateLimitedReason(response) }
      }
      if (!response.ok) throw upstreamError(response.status)
      return { ok: true, commits: (await response.json()) as GitHubCommitResponse[] }
    },

    async getCiRuns(owner, repo, headSha): Promise<CiRunsResult> {
      const response = await get(
        `/repos/${owner}/${repo}/actions/runs?head_sha=${encodeURIComponent(headSha)}&per_page=5`,
      )
      if (response.status === 404 || response.status === 409) {
        return { ok: true, runs: [] }
      }
      if (isRateLimited(response)) {
        return { ok: false, reason: rateLimitedReason(response) }
      }
      // 403 tanpa header batas laju hampir selalu berarti Actions dimatikan
      // untuk repo ini. Itu bukan alasan membatalkan seluruh analisis.
      if (response.status === 403) {
        return { ok: false, reason: 'data GitHub Actions tidak bisa dibaca untuk repo ini' }
      }
      if (!response.ok) throw upstreamError(response.status)
      const body = (await response.json()) as GitHubWorkflowRunsResponse
      return { ok: true, runs: body.workflow_runs }
    },
  }
}
