import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { fixtureGitHubClient } from '../github/fixture'
import { loadSnapshot } from '../github/snapshot'
import { analyze } from '../engine/ladder'
import { ReportView } from './report-view'

const NOW = new Date('2026-11-12T07:07:00.000Z')

describe('ReportView rendering', () => {
  it('renders report for absensi-qr (Level 2 reached, Level 3 frontier, ci_jalan next fix)', async () => {
    const snapshot = await loadSnapshot(
      fixtureGitHubClient('absensi-qr'),
      'smk-bisa',
      'absensi-qr',
    )
    const analysis = analyze(snapshot, { now: NOW })
    const analysisId = 'absensi12345'

    const html = renderToStaticMarkup(
      <ReportView analysis={analysis} analysisId={analysisId} />,
    )

    // Statement and subline
    expect(html).toContain('Level 2')
    expect(html).toContain('lulus.')
    expect(html).toContain('Berikutnya Level 3')

    // Frontier panel shows Level 3 checks and human names
    expect(html).toContain('LEVEL 3')
    expect(html).toContain('CI jalan di setiap push')
    expect(html).toContain('Ada test otomatis')
    expect(html).toContain('Riwayat commit terbaca')

    // Next fix band shows title and meta
    expect(html).toContain('SATU PERBAIKAN BERIKUTNYA')
    expect(html).toContain('Tambahkan satu workflow CI')
    expect(html).toContain('GitHub Actions')

    // Permalink
    expect(html).toContain('/r/absensi12345')

    // Phone strip navigation
    expect(html).toContain('class="phone-strip"')
    expect(html).toContain('01')
    expect(html).toContain('02')
    expect(html).toContain('03')
    expect(html).toContain('04')
  })

  it('renders report for bare-html (Level 1 reached, Level 2 frontier, cara_install next fix)', async () => {
    const snapshot = await loadSnapshot(
      fixtureGitHubClient('bare-html'),
      'pemula',
      'bare-html',
    )
    const analysis = analyze(snapshot, { now: NOW })
    const analysisId = 'barehtml1234'

    const html = renderToStaticMarkup(
      <ReportView analysis={analysis} analysisId={analysisId} />,
    )

    expect(html).toContain('Level 1')
    expect(html).toContain('lulus.')
    expect(html).toContain('Berikutnya Level 2')
    expect(html).toContain('Ada cara menjalankan')
    expect(html).toContain('Tulis cara menjalankan proyek di README')
    expect(html).toContain('/r/barehtml1234')
  })

  it('renders report for siap-rilis (Level 4 reached, all passed, no next fix)', async () => {
    const snapshot = await loadSnapshot(
      fixtureGitHubClient('siap-rilis'),
      'expert',
      'siap-rilis',
    )
    const analysis = analyze(snapshot, { now: NOW })
    const analysisId = 'siaprilis123'

    const html = renderToStaticMarkup(
      <ReportView analysis={analysis} analysisId={analysisId} />,
    )

    expect(html).toContain('Level 4')
    expect(html).toContain('lulus.')
    expect(html).toContain('Semua check lulus. Tidak ada yang menahan.')
    expect(html).toContain('Semua check lulus. Berikutnya tidak ada — repository ini siap dibagikan.')
  })
})
