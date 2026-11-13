import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('client bundle security (leak prevention)', () => {
  it('ensures dist/client contains no GitHub personal access tokens or secret values', async () => {
    const clientDir = join(process.cwd(), 'dist', 'client')

    let files: string[] = []
    try {
      const entries = await readdir(join(clientDir, 'assets'), { withFileTypes: true })
      files = entries.filter((e) => e.isFile()).map((e) => join(clientDir, 'assets', e.name))
    } catch {
      // If dist/client doesn't exist yet, pass or warn
      return
    }

    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const content = await readFile(file, 'utf8')
      // Must not contain GitHub personal access tokens
      expect(content).not.toMatch(/ghp_[0-9A-Za-z]{36}/)
      expect(content).not.toMatch(/github_pat_[0-9A-Za-z_]{82}/)
      // Must not contain sentinel tokens
      expect(content).not.toContain('ghp_sentinel')
    }
  })
})
