import { PGlite } from '@electric-sql/pglite'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const MIGRATIONS = ['0001_init', '0002_analysis', '0003_auth_and_assistant'] as const
const migrationsDir = join(process.cwd(), 'db', 'migrations')

declare global {
  // eslint-disable-next-line no-var
  var __devverse_pglite: Promise<PGlite> | undefined
}

async function migrate(db: PGlite): Promise<void> {
  await db.exec(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `)

  for (const id of MIGRATIONS) {
    const applied = await db.query<{ id: string }>(
      'select id from schema_migrations where id = $1',
      [id],
    )
    if (applied.rows.length > 0) {
      continue
    }

    const sql = await readFile(join(migrationsDir, `${id}.up.sql`), 'utf8')
    await db.transaction(async (tx) => {
      await tx.exec(sql)
      await tx.query('insert into schema_migrations (id) values ($1)', [id])
    })
  }
}

async function open(): Promise<PGlite> {
  if (process.env.VITEST) {
    const db = new PGlite()
    await migrate(db)
    return db
  }

  const dataDir = join(process.cwd(), '.data', 'pglite')
  await mkdir(dataDir, { recursive: true })
  const db = new PGlite(dataDir)
  await migrate(db)
  return db
}

export function getDatabase(): Promise<PGlite> {
  globalThis.__devverse_pglite ??= open()
  return globalThis.__devverse_pglite
}

export type AppHealth = {
  engineVersion: string
  databaseVersion: string
}

export async function readAppHealth(): Promise<AppHealth> {
  const db = await getDatabase()
  const meta = await db.query<{ value: string }>(
    "select value from app_meta where key = 'engine_version'",
  )
  const version = await db.query<{ version: string }>('select version() as version')

  return {
    engineVersion: meta.rows[0]?.value ?? 'unknown',
    databaseVersion: version.rows[0]?.version ?? 'unknown',
  }
}
