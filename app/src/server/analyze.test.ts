import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'
import { fixtureGitHubClient, FIXTURE_NAMES } from '../github/fixture'
import type { FixtureName } from '../github/fixture'
import type { Analysis } from '../engine/types'
import { analyzeRepository, AnalyzeError } from './analyze'
import { createAnalysisId, pgliteAnalysisStore } from './store'
import type { AnalysisStore } from './store'

const NOW = new Date('2026-11-12T07:07:00.000Z')

function memoryStore(): AnalysisStore & { size: () => number } {
  const rows = new Map<string, Analysis>()
  return {
    async save(analysis) {
      const id = createAnalysisId()
      rows.set(id, structuredClone(analysis))
      return id
    },
    async find(id) {
      const row = rows.get(id)
      return row ? structuredClone(row) : null
    },
    size() {
      return rows.size
    },
  }
}

async function analyzeFixture(fixture: FixtureName, store: AnalysisStore): Promise<Analysis> {
  const result = await analyzeRepository(
    { url: `https://github.com/${fixture}/${fixture}`, ipHash: 'ip-hash-test' },
    { client: fixtureGitHubClient(fixture), store, now: () => NOW },
  )
  const stored = await store.find(result.id)
  if (!stored) throw new Error('analysis tidak tersimpan')
  return stored
}

const FIXTURE_FULL_NAMES: Record<FixtureName, string> = {
  'bare-html': 'siswa-smk/tugas-html',
  'absensi-qr': 'rizkyfajar/absensi-qr',
  'siap-rilis': 'devverse-lab/notes-api',
}

describe('analyze pipeline', () => {
  it.each(FIXTURE_NAMES)('stores the fixture verdicts for %s', async (fixture) => {
    const store = memoryStore()
    const analysis = await analyzeFixture(fixture, store)

    expect(store.size()).toBe(1)
    expect(analysis.repo.fullName).toBe(FIXTURE_FULL_NAMES[fixture])
    expect(analysis.checks).toHaveLength(10)
    expect(analysis.analyzedAt).toBe(NOW.toISOString())
  })

  it('rejects a URL that is not a GitHub repository', async () => {
    const store = memoryStore()
    await expect(
      analyzeRepository(
        { url: 'https://gitlab.com/siswa/proyek', ipHash: 'x' },
        { client: fixtureGitHubClient('bare-html'), store, now: () => NOW },
      ),
    ).rejects.toBeInstanceOf(AnalyzeError)
  })

  it('does not write anything when the URL is invalid', async () => {
    const store = memoryStore()
    await analyzeRepository(
      { url: 'bukan url', ipHash: 'x' },
      { client: fixtureGitHubClient('bare-html'), store, now: () => NOW },
    ).catch(() => undefined)
    expect(store.size()).toBe(0)
  })

  it('returns null for an id that was never stored', async () => {
    const store = memoryStore()
    expect(await store.find('tidakada1234')).toBeNull()
  })
})

describe('pglite store', () => {
  it('round-trips an analysis through the real schema', async () => {
    const db = new PGlite()
    const up = await readFile(join(process.cwd(), 'db', 'migrations', '0001_init.up.sql'), 'utf8')
    const analysisUp = await readFile(
      join(process.cwd(), 'db', 'migrations', '0002_analysis.up.sql'),
      'utf8',
    )
    await db.exec(up)
    await db.exec(analysisUp)

    const store = pgliteAnalysisStore(async () => db)
    const analysis = await analyzeFixture('absensi-qr', store)

    expect(analysis.repo.fullName).toBe('rizkyfajar/absensi-qr')
    expect(analysis.reachedLevel).toBe(2)
    expect(analysis.frontierLevel).toBe(3)
    expect(analysis.nextFix?.id).toBe('ci_jalan')
    expect(analysis.checks.find((check) => check.id === 'riwayat_commit')?.verdict).toBe(
      'tidak_tahu',
    )

    await db.close()
  }, 30_000)

  it('does not leak the ip hash into the report payload', async () => {
    const db = new PGlite()
    const up = await readFile(join(process.cwd(), 'db', 'migrations', '0001_init.up.sql'), 'utf8')
    const analysisUp = await readFile(
      join(process.cwd(), 'db', 'migrations', '0002_analysis.up.sql'),
      'utf8',
    )
    await db.exec(up)
    await db.exec(analysisUp)

    const store = pgliteAnalysisStore(async () => db)
    const analysis = await analyzeFixture('bare-html', store)

    expect(JSON.stringify(analysis)).not.toContain('ip-hash-test')
    await db.close()
  }, 30_000)
})
