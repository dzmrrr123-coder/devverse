export type ParsedGitHubUrl = {
  owner: string
  repo: string
  canonicalUrl: string
}

const NAME = /^[A-Za-z0-9._-]+$/

function validName(value: string): boolean {
  return value.length > 0 && value.length <= 100 && NAME.test(value) && value !== '.' && value !== '..'
}

/**
 * Menerima URL repository GitHub yang lazim ditempel siswa:
 * https://github.com/owner/repo, dengan atau tanpa www, .git, garis miring
 * penutup, query, atau halaman di dalam repository. Juga menerima owner/repo.
 */
export function parseGitHubUrl(input: string): ParsedGitHubUrl | null {
  const raw = input.trim()
  if (!raw) return null

  const withoutScheme = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  const [hostAndPath] = withoutScheme.split(/[?#]/)
  if (!hostAndPath) return null

  const segments = hostAndPath.split('/').filter(Boolean)
  let owner: string | undefined
  let repo: string | undefined

  if (segments.length === 2 && !hostAndPath.includes('.')) {
    owner = segments[0]
    repo = segments[1]
  } else if (segments[0]?.toLowerCase() === 'github.com') {
    owner = segments[1]
    repo = segments[2]
  } else {
    return null
  }

  if (!owner || !repo) return null

  const cleanRepo = repo.replace(/\.git$/i, '')
  if (!validName(owner) || !validName(cleanRepo)) return null

  return {
    owner,
    repo: cleanRepo,
    canonicalUrl: `https://github.com/${owner}/${cleanRepo}`,
  }
}
