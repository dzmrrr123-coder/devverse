export type GitHubRepoResponse = {
  name: string
  full_name: string
  owner: { login: string }
  default_branch: string
  description: string | null
  homepage: string | null
  license: { spdx_id: string | null } | null
  language: string | null
  size: number
  html_url: string
}

export type GitHubReadmeResponse = {
  name: string
  path: string
  encoding: string
  content: string
} | null

export type GitHubTreeResponse = {
  sha: string
  truncated: boolean
  tree: { path: string; type: string }[]
}

export type GitHubCommitResponse = {
  sha: string
  commit: {
    message: string
    committer: { date: string } | null
  }
}

export type CommitsResult =
  | { ok: true; commits: GitHubCommitResponse[] }
  | { ok: false; reason: string }

export type GitHubWorkflowRun = {
  name: string | null
  conclusion: string | null
  html_url: string
  head_sha: string
}

export type GitHubWorkflowRunsResponse = {
  total_count: number
  workflow_runs: GitHubWorkflowRun[]
}

/**
 * Hanya run pada commit yang diminta. `ok: false` berarti tidak terbaca
 * (batas API atau Actions dimatikan), bukan "tidak ada run".
 */
export type CiRunsResult =
  | { ok: true; runs: GitHubWorkflowRun[] }
  | { ok: false; reason: string }

export type GitHubErrorKind = 'not_found' | 'rate_limited' | 'upstream'

export class GitHubError extends Error {
  readonly kind: GitHubErrorKind
  readonly status: number
  readonly resetAt: string | null

  constructor(kind: GitHubErrorKind, message: string, status: number, resetAt?: string | null) {
    super(message)
    this.name = 'GitHubError'
    this.kind = kind
    this.status = status
    this.resetAt = resetAt ?? null
  }
}

export interface GitHubClient {
  getRepo: (owner: string, repo: string) => Promise<GitHubRepoResponse>
  getReadme: (owner: string, repo: string) => Promise<GitHubReadmeResponse>
  getTree: (owner: string, repo: string, ref: string) => Promise<GitHubTreeResponse>
  getCommits: (owner: string, repo: string) => Promise<CommitsResult>
  getCiRuns: (owner: string, repo: string, headSha: string) => Promise<CiRunsResult>
}
