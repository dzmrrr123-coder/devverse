import { randomBytes } from 'node:crypto'
import type { PGlite } from '@electric-sql/pglite'
import { buildLadder, pickNextFix } from '../engine/ladder'
import { checkCatalog } from '../engine/checks'
import type { Analysis, CheckResult, Verdict } from '../engine/types'
import { getDatabase } from './db'

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** 12 karakter base62 - cukup pendek untuk URL, cukup panjang untuk tidak bentrok. */
export function createAnalysisId(): string {
  const bytes = randomBytes(12)
  let id = ''
  for (const byte of bytes) {
    id += ALPHABET[byte % ALPHABET.length]
  }
  return id
}

export interface AnalysisStore {
  save: (analysis: Analysis, meta: { ipHash: string }) => Promise<string>
  find: (id: string) => Promise<Analysis | null>
}

type AnalysisRow = {
  id: string
  owner: string
  repo: string
  default_branch: string
  commit_sha: string | null
  engine_version: string
  created_at: string | Date
  repo_url: string
  repo_description: string | null
}

type CheckRow = {
  check_id: string
  level: number
  verdict: Verdict
  evidence_path: string | null
  evidence_url: string | null
  detail: string
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function rebuildAnalysis(row: AnalysisRow, rows: CheckRow[]): Analysis {
  const catalog = checkCatalog()
  const checks: CheckResult[] = rows.map((checkRow) => {
    const definition = catalog.find((check) => check.id === checkRow.check_id)
    return {
      id: checkRow.check_id as CheckResult['id'],
      level: checkRow.level as CheckResult['level'],
      name: definition?.name ?? checkRow.check_id,
      verdict: checkRow.verdict,
      evidence: checkRow.detail,
      evidencePath: checkRow.evidence_path,
      evidenceUrl: checkRow.evidence_url,
    }
  })

  const { levels, reachedLevel, frontierLevel } = buildLadder(checks)

  return {
    engineVersion: row.engine_version,
    repo: {
      owner: row.owner,
      name: row.repo,
      fullName: `${row.owner}/${row.repo}`,
      url: row.repo_url,
      description: row.repo_description,
      defaultBranch: row.default_branch,
      language: null,
    },
    commitSha: row.commit_sha,
    analyzedAt: toIso(row.created_at),
    levels,
    checks,
    reachedLevel,
    frontierLevel,
    nextFix: pickNextFix(checks, frontierLevel),
  }
}

export function pgliteAnalysisStore(
  database: () => Promise<PGlite> = getDatabase,
): AnalysisStore {
  return {
    async save(analysis, meta): Promise<string> {
      const db = await database()
      const id = createAnalysisId()

      await db.transaction(async (tx) => {
        await tx.query(
          `insert into analysis
            (id, owner, repo, default_branch, commit_sha, engine_version, ip_hash, repo_url, repo_description)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id,
            analysis.repo.owner,
            analysis.repo.name,
            analysis.repo.defaultBranch,
            analysis.commitSha,
            analysis.engineVersion,
            meta.ipHash,
            analysis.repo.url,
            analysis.repo.description,
          ],
        )

        for (const check of analysis.checks) {
          await tx.query(
            `insert into check_result
              (analysis_id, check_id, level, verdict, evidence_path, evidence_url, detail)
             values ($1, $2, $3, $4, $5, $6, $7)`,
            [
              id,
              check.id,
              check.level,
              check.verdict,
              check.evidencePath,
              check.evidenceUrl,
              check.evidence,
            ],
          )
        }
      })

      return id
    },

    async find(id): Promise<Analysis | null> {
      const db = await database()
      const analysis = await db.query<AnalysisRow>(
        `select id, owner, repo, default_branch, commit_sha, engine_version, created_at,
                repo_url, repo_description
           from analysis where id = $1`,
        [id],
      )
      const row = analysis.rows.at(0)
      if (!row) return null

      const checks = await db.query<CheckRow>(
        `select check_id, level, verdict, evidence_path, evidence_url, detail
           from check_result where analysis_id = $1`,
        [id],
      )

      return rebuildAnalysis(row, checks.rows)
    },
  }
}
