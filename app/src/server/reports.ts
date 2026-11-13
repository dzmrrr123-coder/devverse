import { createServerFn } from '@tanstack/react-start'
import type { Analysis } from '../engine/types'

const ANALYSIS_ID = /^[0-9A-Za-z]{12}$/

/**
 * Membaca satu laporan dari database. Laporan yang tidak ada mengembalikan
 * `null`, dan route yang memutuskan 404 — bukan fungsi ini.
 */
export const getReport = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<Analysis | null> => {
    if (!ANALYSIS_ID.test(id)) return null

    const { pgliteAnalysisStore } = await import('./store')
    return pgliteAnalysisStore().find(id)
  })
