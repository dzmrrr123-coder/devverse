import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
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

export const FIXTURE_NAMES = ['bare-html', 'absensi-qr', 'siap-rilis'] as const
export type FixtureName = (typeof FIXTURE_NAMES)[number]

const RATE_LIMIT_REASON = 'batas API GitHub 60/jam - coba lagi sekitar 20 menit'

async function readJson<T>(fixture: FixtureName, file: string): Promise<T | null> {
  try {
    const raw = await readFile(join(process.cwd(), 'fixtures', fixture, file), 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function isRateLimited(value: unknown): value is { status: number; message?: string } {
  if (typeof value !== 'object' || value === null) return false
  const status = (value as { status?: unknown }).status
  return status === 403 || status === 429
}

/**
 * Klien yang membaca respons GitHub yang sudah direkam. Tidak ada jaringan:
 * dipakai test kontrak dan test end-to-end.
 */
export function fixtureGitHubClient(fixture: FixtureName): GitHubClient {
  return {
    async getRepo(): Promise<GitHubRepoResponse> {
      const repo = await readJson<GitHubRepoResponse>(fixture, 'repo.json')
      if (!repo) throw new Error(`fixture ${fixture}: repo.json tidak ada`)
      return repo
    },

    async getReadme(): Promise<GitHubReadmeResponse> {
      const readme = await readJson<GitHubReadmeResponse | { status: number }>(fixture, 'readme.json')
      if (!readme) return null
      if (isRateLimited(readme)) return null
      return readme as GitHubReadmeResponse
    },

    async getTree(): Promise<GitHubTreeResponse> {
      const tree = await readJson<GitHubTreeResponse>(fixture, 'tree.json')
      if (!tree) throw new Error(`fixture ${fixture}: tree.json tidak ada`)
      return tree
    },

    async getCommits(): Promise<CommitsResult> {
      const commits = await readJson<GitHubCommitResponse[] | { status: number }>(
        fixture,
        'commits.json',
      )
      if (!commits) return { ok: true, commits: [] }
      if (isRateLimited(commits)) {
        return { ok: false, reason: RATE_LIMIT_REASON }
      }
      return { ok: true, commits: commits as GitHubCommitResponse[] }
    },

    async getCiRuns(): Promise<CiRunsResult> {
      const runs = await readJson<GitHubWorkflowRunsResponse | { status: number }>(
        fixture,
        'ci.json',
      )
      if (!runs) return { ok: true, runs: [] }
      if (isRateLimited(runs)) {
        return { ok: false, reason: RATE_LIMIT_REASON }
      }
      return { ok: true, runs: (runs as GitHubWorkflowRunsResponse).workflow_runs }
    },
  }
}
