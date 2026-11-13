import { createFileRoute } from '@tanstack/react-router'
import { CHECK_GUIDES, LEVEL_GUIDES } from '../engine/guide'
import type { CheckGuide } from '../engine/guide'
import type { Level } from '../engine/types'

export const Route = createFileRoute('/how')({
  component: HowPage,
  head: () => ({
    meta: [
      { title: 'Cara membaca 10 check — DEVVERSE' },
      {
        name: 'description',
        content:
          'Arti setiap check DEVVERSE: apa yang dinilai, apa yang terlihat kalau lulus, dan satu hal yang bisa diperbaiki.',
      },
    ],
  }),
})

function checksFor(level: Level): CheckGuide[] {
  return Object.values(CHECK_GUIDES).filter((check) => check.level === level)
}

function HowPage() {
  return (
    <div className="entry-page">
      <header className="entry-bar">
        <a className="wordmark" href="/">
          DEVVERSE
        </a>
        <a className="control" href="/">
          Analisis repository
        </a>
      </header>

      <main className="doc">
        <p className="micro-label quiet">PANDUAN</p>
        <h1 className="doc-title">Apa arti sepuluh check ini.</h1>
        <p className="doc-lede">
          Laporan menjawab &ldquo;proyekku bagaimana&rdquo;. Halaman ini menjawab
          &ldquo;check ini maksudnya apa&rdquo;. Setiap check punya satu kalimat arti, satu
          tanda lulus, dan satu perbaikan yang bisa langsung dikerjakan.
        </p>

        <nav className="doc-index" aria-label="Daftar level">
          {LEVEL_GUIDES.map((level) => (
            <a key={level.level} href={`#level-${level.level}`}>
              <span className="doc-index-number">0{level.level}</span>
              <span>{level.name}</span>
            </a>
          ))}
        </nav>

        {LEVEL_GUIDES.map((level) => (
          <section
            key={level.level}
            className="doc-level"
            id={`level-${level.level}`}
            aria-labelledby={`level-${level.level}-heading`}
          >
            <header className="doc-level-head">
              <span className="doc-level-number">0{level.level}</span>
              <div>
                <h2 id={`level-${level.level}-heading`}>{level.name}</h2>
                <p>{level.job}</p>
              </div>
            </header>

            {checksFor(level.level).map((check) => (
              <article key={check.id} className="doc-check" id={check.id}>
                <p className="micro-label quiet doc-check-id">{check.id}</p>
                <h3>{check.name}</h3>
                <p className="doc-check-meaning">{check.meaning}</p>
                <dl className="doc-check-facts">
                  <div>
                    <dt>Kalau lulus</dt>
                    <dd>{check.passing}</dd>
                  </div>
                  <div>
                    <dt>Kalau belum</dt>
                    <dd>
                      <strong>{check.fix.title}.</strong> {check.fix.body}
                      <span className="doc-check-meta">{check.fix.meta}</span>
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>
        ))}

        <footer className="doc-footer">
          <p>Level lulus hanya kalau semua check-nya lulus. `tidak tahu` bukan lulus.</p>
          <a className="control" href="/">
            Analisis repository
          </a>
        </footer>
      </main>
    </div>
  )
}
