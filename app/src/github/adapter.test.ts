import { afterEach, describe, expect, it, vi } from 'vitest'
import { fixtureGitHubClient } from './fixture'
import { loadSnapshot } from './snapshot'
import { liveGitHubClient } from './live'
import { parseGitHubUrl } from './url'
import { GitHubError } from './types'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const repoResponse = {
  name: 'proyek',
  full_name: 'siswa/proyek',
  owner: { login: 'siswa' },
  default_branch: 'main',
  description: 'proyek belajar',
  homepage: null,
  license: null,
  language: 'TypeScript',
  size: 10,
  html_url: 'https://github.com/siswa/proyek',
}

describe('parseGitHubUrl', () => {
  it('accepts the common URL forms', () => {
    expect(parseGitHubUrl('https://github.com/siswa/proyek')?.canonicalUrl).toBe(
      'https://github.com/siswa/proyek',
    )
    expect(parseGitHubUrl('github.com/siswa/proyek.git')?.repo).toBe('proyek')
    expect(parseGitHubUrl('siswa/proyek')?.owner).toBe('siswa')
    expect(parseGitHubUrl('https://www.github.com/siswa/proyek/tree/main')?.repo).toBe('proyek')
  })

  it('rejects a non-GitHub host', () => {
    expect(parseGitHubUrl('https://gitlab.com/siswa/proyek')).toBeNull()
  })

  it('rejects an incomplete path', () => {
    expect(parseGitHubUrl('https://github.com/siswa')).toBeNull()
    expect(parseGitHubUrl('')).toBeNull()
  })

  it('rejects a name with characters GitHub does not allow', () => {
    expect(parseGitHubUrl('https://github.com/siswa/pro yek')).toBeNull()
  })
})

describe('fixture adapter contract', () => {
  it('decodes the recorded README from base64', async () => {
    const snapshot = await loadSnapshot(fixtureGitHubClient('bare-html'), 'siswa-smk', 'tugas-html')
    expect(snapshot.readme?.path).toBe('README.md')
    expect(snapshot.readme?.text).toContain('Halaman profil sekolah')
  })

  it('maps the tree to blob paths only', async () => {
    const snapshot = await loadSnapshot(fixtureGitHubClient('siap-rilis'), 'devverse-lab', 'notes-api')
    expect(snapshot.files).toContain('src/index.ts')
    expect(snapshot.files).toContain('.github/workflows/ci.yml')
    expect(snapshot.files.every((file) => !file.endsWith('/'))).toBe(true)
  })

  it('records an unreadable commit history as null with a reason', async () => {
    const snapshot = await loadSnapshot(fixtureGitHubClient('absensi-qr'), 'rizkyfajar', 'absensi-qr')
    expect(snapshot.commits).toBeNull()
    expect(snapshot.commitsUnavailableReason).toMatch(/batas API GitHub/)
  })
})

describe('live adapter contract', () => {
  it('sends the server token when it exists', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'ghp_sentinel_123')
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify(repoResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await liveGitHubClient().getRepo('siswa', 'proyek')

    const init = fetchMock.mock.calls[0]?.[1]
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer ghp_sentinel_123')
  })

  it('does not send an Authorization header without a token', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify(repoResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await liveGitHubClient().getRepo('siswa', 'proyek')

    const init = fetchMock.mock.calls[0]?.[1]
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('maps a 404 to not_found', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })))

    await expect(liveGitHubClient().getRepo('siswa', 'hilang')).rejects.toMatchObject({
      kind: 'not_found',
    })
  })

  it('maps an exhausted rate limit to rate_limited with a reset time', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('{}', {
            status: 403,
            headers: {
              'x-ratelimit-remaining': '0',
              'x-ratelimit-reset': '1763000000',
            },
          }),
      ),
    )

    const error = await liveGitHubClient()
      .getRepo('siswa', 'proyek')
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(GitHubError)
    expect((error as GitHubError).kind).toBe('rate_limited')
    expect((error as GitHubError).resetAt).toBeTruthy()
  })

  it('turns a rate-limited commit request into an unreadable history, not a crash', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 403, headers: { 'retry-after': '120' } })),
    )

    const result = await liveGitHubClient().getCommits('siswa', 'proyek')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toMatch(/batas API GitHub/)
    }
  })
})
