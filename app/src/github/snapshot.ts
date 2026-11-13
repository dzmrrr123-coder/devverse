import type { CiRunsResult, GitHubClient } from './types'
import type { RepoSnapshot } from '../engine/types'

function decodeBase64(content: string): string {
  return Buffer.from(content, 'base64').toString('utf8')
}

export async function loadSnapshot(
  client: GitHubClient,
  owner: string,
  repo: string,
): Promise<RepoSnapshot> {
  const repository = await client.getRepo(owner, repo)

  const [readme, tree, commits] = await Promise.all([
    client.getReadme(owner, repo),
    client.getTree(owner, repo, repository.default_branch),
    client.getCommits(owner, repo),
  ])

  // Run CI dicocokkan ke commit terakhir, karena "jalan" berarti run sukses
  // pada commit yang sekarang — bukan pada commit lama mana pun.
  const headSha = commits.ok ? (commits.commits[0]?.sha ?? null) : null
  const ci: CiRunsResult = headSha
    ? await client.getCiRuns(owner, repo, headSha)
    : {
        ok: false,
        reason: 'sha commit terakhir tidak terbaca, run CI tidak bisa dicocokkan',
      }

  return {
    owner: repository.owner.login,
    name: repository.name,
    fullName: repository.full_name,
    url: repository.html_url,
    defaultBranch: repository.default_branch,
    description: repository.description,
    homepage: repository.homepage,
    license: repository.license?.spdx_id ?? null,
    language: repository.language,
    sizeKb: repository.size,
    readme: readme
      ? {
          path: readme.path,
          text: readme.encoding === 'base64' ? decodeBase64(readme.content) : readme.content,
        }
      : null,
    files: tree.tree.filter((entry) => entry.type === 'blob').map((entry) => entry.path),
    commits: commits.ok
      ? commits.commits.map((commit) => ({
          sha: commit.sha,
          date: commit.commit.committer?.date ?? '',
        }))
      : null,
    commitsUnavailableReason: commits.ok ? null : commits.reason,
    ciRuns: ci.ok
      ? ci.runs.map((run) => ({
          name: run.name ?? 'workflow',
          conclusion: run.conclusion,
          url: run.html_url,
        }))
      : null,
    ciUnavailableReason: ci.ok ? null : ci.reason,
  }
}
