import { analyze } from '../engine/ladder'
import type { Analysis } from '../engine/types'
import { loadSnapshot } from '../github/snapshot'
import type { GitHubClient } from '../github/types'
import { parseGitHubUrl } from '../github/url'
import type { AnalysisStore } from './store'
import { logger } from './logger'

export class AnalyzeError extends Error {
  readonly code: 'url_tidak_valid'

  constructor(code: 'url_tidak_valid', message: string) {
    super(message)
    this.name = 'AnalyzeError'
    this.code = code
  }
}

export type AnalyzeInput = {
  url: string
  ipHash: string
}

export type AnalyzeDeps = {
  client: GitHubClient
  store: AnalysisStore
  now?: () => Date
}

export type AnalyzeResult = {
  id: string
  analysis: Analysis
}

/**
 * Satu jalur dari URL ke laporan tersimpan. Route hanya memanggil fungsi ini;
 * test memanggilnya dengan klien fixture dan store di memori.
 */
export async function analyzeRepository(
  input: AnalyzeInput,
  deps: AnalyzeDeps,
): Promise<AnalyzeResult> {
  const parsed = parseGitHubUrl(input.url)
  if (!parsed) {
    throw new AnalyzeError(
      'url_tidak_valid',
      'Itu bukan URL repository GitHub. Contoh: https://github.com/owner/repo',
    )
  }

  logger.info({ owner: parsed.owner, repo: parsed.repo }, 'menganalisis repository')
  const snapshot = await loadSnapshot(deps.client, parsed.owner, parsed.repo)
  const analysis = analyze(snapshot, { now: deps.now?.() ?? new Date() })
  const id = await deps.store.save(analysis, { ipHash: input.ipHash })
  logger.info({ id, reachedLevel: analysis.reachedLevel }, 'analisis selesai')

  return { id, analysis }
}
