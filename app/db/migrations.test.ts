import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'

const migrationsDir = join(process.cwd(), 'db', 'migrations')
const up = await readFile(join(migrationsDir, '0001_init.up.sql'), 'utf8')
const down = await readFile(join(migrationsDir, '0001_init.down.sql'), 'utf8')

describe('0001_init', () => {
  it('applies on a fresh database and seeds engine_version', async () => {
    const db = new PGlite()
    await db.exec(up)

    const result = await db.query<{ value: string }>(
      "select value from app_meta where key = 'engine_version'",
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]?.value).toBe('0.0.0-phase0')
    await db.close()
  }, 30_000)

  it('rolls back to an empty database', async () => {
    const db = new PGlite()
    await db.exec(up)
    await db.exec(down)

    await expect(db.query('select * from app_meta')).rejects.toThrow(/does not exist/i)
    await db.close()
  }, 30_000)
})
