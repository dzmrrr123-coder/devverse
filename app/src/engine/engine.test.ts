import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fixtureGitHubClient, FIXTURE_NAMES } from '../github/fixture'
import type { FixtureName } from '../github/fixture'
import { loadSnapshot } from '../github/snapshot'
import type { CheckId, RepoSnapshot, Verdict } from './types'
import { analyze, buildLadder, evaluateChecks, pickNextFix } from './ladder'

type ExpectedFixture = {
  reachedLevel: number
  frontierLevel: number | null
  nextFix: string | null
  checks: Record<string, Verdict>
}

type ExpectedFile = {
  engineVersion: string
  fixtures: Record<string, ExpectedFixture | undefined>
}

const NOW = new Date('2026-11-12T07:07:00.000Z')

async function expected(): Promise<ExpectedFile> {
  const raw = await readFile(join(process.cwd(), 'fixtures', 'expected.json'), 'utf8')
  return JSON.parse(raw) as ExpectedFile
}

async function snapshotFor(fixture: FixtureName): Promise<RepoSnapshot> {
  return loadSnapshot(fixtureGitHubClient(fixture), 'owner', 'repo')
}

function snapshot(overrides: Partial<RepoSnapshot>): RepoSnapshot {
  return {
    owner: 'siswa',
    name: 'proyek',
    fullName: 'siswa/proyek',
    url: 'https://github.com/siswa/proyek',
    defaultBranch: 'main',
    description: 'Proyek belajar yang cukup jelas',
    homepage: null,
    license: null,
    language: 'TypeScript',
    sizeKb: 10,
    readme: { path: 'README.md', text: 'x'.repeat(120) },
    files: ['README.md', 'src/index.ts'],
    commits: [{ sha: 'abc', date: '2026-11-01T00:00:00Z' }],
    commitsUnavailableReason: null,
    ciRuns: [],
    ciUnavailableReason: null,
    ...overrides,
  }
}

describe('engine: fixture verdicts', () => {
  it('has 10 checks, three per level plus one at Level 4', () => {
    const checks = evaluateChecks(snapshot({}))
    expect(checks).toHaveLength(10)
    for (const level of [1, 2, 3] as const) {
      expect(checks.filter((check) => check.level === level)).toHaveLength(3)
    }
    expect(checks.filter((check) => check.level === 4)).toHaveLength(1)
  })

  it.each(FIXTURE_NAMES)('matches the hand-written oracle for %s', async (fixture) => {
    const oracle = await expected()
    const want = oracle.fixtures[fixture]
    if (!want) throw new Error(`oracle tidak memuat fixture ${fixture}`)

    const result = analyze(await snapshotFor(fixture), { now: NOW })
    const got = Object.fromEntries(result.checks.map((check) => [check.id, check.verdict]))

    expect(got).toEqual(want.checks)
    expect(result.reachedLevel).toBe(want.reachedLevel)
    expect(result.frontierLevel).toBe(want.frontierLevel)
    expect(result.nextFix?.id ?? null).toBe(want.nextFix)
  })

  it.each(FIXTURE_NAMES)('is deterministic for %s', async (fixture) => {
    const repo = await snapshotFor(fixture)
    expect(analyze(repo, { now: NOW })).toEqual(analyze(repo, { now: NOW }))
  })

  it('never reports a zero score for a bare HTML project', async () => {
    const result = analyze(await snapshotFor('bare-html'), { now: NOW })
    expect(result.reachedLevel).toBeGreaterThanOrEqual(1)
    expect(result.levels[0]?.state).toBe('lulus')
  })

  it('marks the level above the frontier as not reached', async () => {
    const result = analyze(await snapshotFor('absensi-qr'), { now: NOW })
    expect(result.levels.map((level) => level.state)).toEqual([
      'lulus',
      'lulus',
      'terbuka',
      'belum',
    ])
  })

  it('carries a reason for every tidak_tahu verdict', async () => {
    const result = analyze(await snapshotFor('absensi-qr'), { now: NOW })
    const unknown = result.checks.filter((check) => check.verdict === 'tidak_tahu')
    expect(unknown.length).toBeGreaterThan(0)
    for (const check of unknown) {
      expect(check.evidence.length).toBeGreaterThan(10)
    }
  })
})

describe('engine: individual checks', () => {
  const verdict = (overrides: Partial<RepoSnapshot>, id: CheckId): Verdict => {
    const checks = evaluateChecks(snapshot(overrides))
    return checks.find((check) => check.id === id)?.verdict ?? 'tidak_tahu'
  }

  it('fails a README that is too short', () => {
    expect(verdict({ readme: { path: 'README.md', text: 'halo' } }, 'readme_ada')).toBe('gagal')
  })

  it('fails when there is no code file', () => {
    expect(verdict({ files: ['README.md', 'foto.png'] }, 'kode_utama')).toBe('gagal')
  })

  it('detects a committed .env', () => {
    expect(verdict({ files: ['README.md', 'src/index.ts', '.env'] }, 'tanpa_rahasia')).toBe('gagal')
  })

  it('does not treat .env.example as a secret', () => {
    expect(
      verdict({ files: ['README.md', 'src/index.ts', '.env.example'] }, 'tanpa_rahasia'),
    ).toBe('lulus')
  })

  it('passes lockfile when there is no dependency manifest', () => {
    expect(verdict({ files: ['README.md', 'index.html'] }, 'lockfile')).toBe('lulus')
  })

  it('fails lockfile when a manifest has no lockfile', () => {
    expect(verdict({ files: ['README.md', 'package.json'] }, 'lockfile')).toBe('gagal')
  })

  it('fails env_contoh when README mentions env but no example exists', () => {
    expect(
      verdict(
        {
          readme: { path: 'README.md', text: `${'x'.repeat(100)}\njalankan dengan process.env.API_KEY` },
          files: ['README.md', 'src/index.ts'],
        },
        'env_contoh',
      ),
    ).toBe('gagal')
  })

  it('fails riwayat_commit when the repository has no commits', () => {
    expect(verdict({ commits: [] }, 'riwayat_commit')).toBe('gagal')
  })

  it('returns tidak_tahu when commits cannot be read', () => {
    expect(
      verdict(
        { commits: null, commitsUnavailableReason: 'batas API GitHub 60/jam' },
        'riwayat_commit',
      ),
    ).toBe('tidak_tahu')
  })

  it('fails lisensi_ada without a license', () => {
    expect(verdict({ license: null }, 'lisensi_ada')).toBe('gagal')
  })
})

describe('ladder', () => {
  it('picks the first failing check at the frontier', () => {
    const checks = evaluateChecks(snapshot({ files: ['README.md'] }))
    const { frontierLevel } = buildLadder(checks)
    expect(pickNextFix(checks, frontierLevel)?.id).toBe('kode_utama')
  })

  it('returns no next fix when every level passes', async () => {
    const result = analyze(await snapshotFor('siap-rilis'), { now: NOW })
    expect(result.frontierLevel).toBeNull()
    expect(result.nextFix).toBeNull()
  })
})
