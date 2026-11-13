import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Analysis, CheckResult, Level, LevelResult, Verdict } from '../engine/types'
import { guideFor, levelGuide } from '../engine/guide'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const NUMBER_WORDS: Record<number, string> = { 1: 'satu', 2: 'dua', 3: 'tiga', 4: 'empat' }

function verdictWord(verdict: Verdict): string {
  if (verdict === 'lulus') return 'lulus'
  if (verdict === 'gagal') return 'gagal'
  return 'tidak_tahu'
}

function stateWord(state: LevelResult['state']): string {
  if (state === 'lulus') return 'lulus'
  if (state === 'terbuka') return 'SEKARANG'
  return 'belum sampai'
}

function checksAt(analysis: Analysis, level: Level): CheckResult[] {
  return analysis.checks.filter((check) => check.level === level)
}

function summaryOf(checks: CheckResult[]): string {
  const counts = { lulus: 0, gagal: 0, tidak_tahu: 0 }
  for (const check of checks) counts[check.verdict] += 1

  const parts: string[] = []
  if (counts.lulus > 0) parts.push(`${NUMBER_WORDS[counts.lulus] ?? counts.lulus} lulus`)
  if (counts.gagal > 0) parts.push(`${NUMBER_WORDS[counts.gagal] ?? counts.gagal} gagal`)
  if (counts.tidak_tahu > 0) {
    parts.push(`${NUMBER_WORDS[counts.tidak_tahu] ?? counts.tidak_tahu} belum terbaca`)
  }

  return `${parts.join(', ')}.`
}

function formatAnalyzedAt(iso: string): { full: string; short: string } {
  const parts = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }).formatToParts(new Date(iso))

  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? ''

  const time = `${value('hour')}:${value('minute')}`
  const day = `${value('day')} ${value('month')}`

  return {
    full: `${day} ${value('year')} ${time} WIB`,
    short: `${day} · ${time} WIB`,
  }
}

function stateClass(verdict: Verdict): string {
  return `state-square is-${verdict.replace('_', '-')}`
}

function RepoIdentity({ analysis }: { analysis: Analysis }) {
  return (
    <div className="repo-identity">
      <p className="micro-label quiet">REPOSITORY</p>
      <a className="repo-name" href={analysis.repo.url} rel="noreferrer" target="_blank">
        {analysis.repo.fullName}
      </a>
      {analysis.repo.description ? (
        <p className="repo-description">{analysis.repo.description}</p>
      ) : null}
    </div>
  )
}

function ShareControl({ path }: { path: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    const absolute = new URL(path, window.location.origin).toString()

    try {
      await navigator.clipboard.writeText(absolute)
      setState('copied')
    } catch {
      setState('failed')
    }

    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1200)
  }

  return (
    <button
      className="control share-control"
      type="button"
      onClick={copy}
      aria-label="Salin tautan laporan"
    >
      <span aria-hidden="true">
        {state === 'copied' ? 'Tersalin' : state === 'failed' ? 'Salin gagal' : 'Bagikan'}
      </span>
      <span className="visually-hidden" role="status">
        {state === 'copied'
          ? 'Tautan laporan tersalin.'
          : state === 'failed'
            ? 'Tautan tidak bisa disalin otomatis.'
            : ''}
      </span>
    </button>
  )
}

function Rail({ analysis }: { analysis: Analysis }) {
  return (
    <aside className="rail">
      <div className="rail-head">
        <a className="wordmark" href="/">
          DEVVERSE
        </a>
        <p className="rail-sub">laporan kesiapan</p>
      </div>

      <RepoIdentity analysis={analysis} />

      <nav className="rail-ladder" aria-label="Tangga kesiapan">
        <p className="micro-label quiet rail-label">TANGGA</p>
        <ol className="levels">
          {analysis.levels.map((level) => (
            <li key={level.level} className="level" data-state={level.state}>
              <span className="level-number">0{level.level}</span>
              <span className="level-station">
                <span className="level-mark" aria-hidden="true" />
                <span className="level-name">{level.name}</span>
                <span className="level-state">{stateWord(level.state)}</span>
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="rail-legend">
        <p className="micro-label quiet rail-label">TANDA</p>
        <ul>
          <li>
            <span className={stateClass('lulus')} aria-hidden="true" />
            lulus
          </li>
          <li>
            <span className={stateClass('gagal')} aria-hidden="true" />
            gagal
          </li>
          <li>
            <span className={stateClass('tidak_tahu')} aria-hidden="true" />
            tidak_tahu
          </li>
        </ul>
      </div>

      <div className="rail-foot">
        <p>engine v{analysis.engineVersion}</p>
        <p>GitHub API · publik</p>
      </div>
    </aside>
  )
}

function PhoneStrip({ levels }: { levels: LevelResult[] }) {
  return (
    <nav className="phone-strip" aria-label="Tangga kesiapan">
      <ol>
        {levels.map((level) => (
          <li key={level.level} data-state={level.state} aria-current={level.state === 'terbuka' ? 'step' : undefined}>
            <span className="strip-number">0{level.level}</span>
            <span className="strip-name">{level.name}</span>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function PassedRows({ analysis }: { analysis: Analysis }) {
  const passed = analysis.levels.filter((level) => level.state === 'lulus')
  if (passed.length === 0) return null

  return (
    <section className="passed" aria-labelledby="passed-heading">
      <h2 className="micro-label quiet" id="passed-heading">
        SUDAH LULUS
      </h2>
      <ol>
        {passed.map((level) => (
          <li key={level.level}>
            <span className="passed-name">{level.name}</span>
            <span className="passed-checks">
              {checksAt(analysis, level.level)
                .map((check) => check.id)
                .join(' · ')}
            </span>
            <span className="passed-state">lulus</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function FrontierPanel({
  analysis,
  panelRef,
  originRef,
}: {
  analysis: Analysis
  panelRef: RefObject<HTMLElement | null>
  originRef: RefObject<HTMLSpanElement | null>
}) {
  const level = analysis.frontierLevel
  if (level === null) return null

  const result = analysis.levels.find((entry) => entry.level === level)
  const checks = checksAt(analysis, level)
  const failing = analysis.nextFix?.id ?? null

  return (
    <section className="panel" aria-labelledby="frontier-heading" ref={panelRef}>
      <header className="panel-header">
        <h2 className="micro-label quiet" id="frontier-heading">
          <span className="desktop-only">
            LEVEL {level} · {result?.name.toUpperCase() ?? ''}
          </span>
          <span className="phone-only">
            LEVEL {level} · {checks.length} CHECK
          </span>
        </h2>
        <p className="micro-label signal">
          <span className="desktop-only">SEKARANG DI SINI</span>
          <span className="phone-only">SEKARANG</span>
        </p>
      </header>

      <ul className="panel-checks">
        {checks.map((check) => (
          <li key={check.id} data-verdict={check.verdict}>
            <span
              className={stateClass(check.verdict)}
              aria-hidden="true"
              ref={check.id === failing ? originRef : undefined}
            />
            <div className="check-copy">
              <p className="check-name">{guideFor(check.id).name}</p>
              <p className="check-evidence">
                {check.evidencePath ? (
                  <span className="check-path">{check.evidencePath}</span>
                ) : null}
                {check.evidencePath ? ' · ' : null}
                {check.evidence}
              </p>
            </div>
            <p className="check-verdict">{verdictWord(check.verdict)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function NextFixBand({
  analysis,
  titleRef,
}: {
  analysis: Analysis
  titleRef: RefObject<HTMLHeadingElement | null>
}) {
  const frontier = analysis.frontierLevel
  const fix = analysis.nextFix

  if (frontier === null) {
    return (
      <aside className="fix" aria-labelledby="fix-heading">
        <p className="micro-label signal" id="fix-heading">
          SATU PERBAIKAN BERIKUTNYA
        </p>
        <p className="fix-empty">
          Semua check lulus. Berikutnya tidak ada — repository ini siap dibagikan.
        </p>
      </aside>
    )
  }

  if (!fix) {
    const unknown = checksAt(analysis, frontier).filter(
      (check) => check.verdict === 'tidak_tahu',
    )
    return (
      <aside className="fix" aria-labelledby="fix-heading">
        <p className="micro-label signal" id="fix-heading">
          SATU PERBAIKAN BERIKUTNYA
        </p>
        <p className="fix-empty">
          Tidak ada yang gagal di Level {frontier}.{' '}
          {unknown.map((check) => check.id).join(', ')} belum terbaca — coba analisis ulang
          beberapa menit lagi.
        </p>
      </aside>
    )
  }

  const guide = guideFor(fix.id)

  return (
    <aside className="fix" aria-labelledby="fix-heading">
      <p className="micro-label signal" id="fix-heading">
        SATU PERBAIKAN BERIKUTNYA
      </p>
      <div className="fix-head">
        <h2 className="fix-title" ref={titleRef}>
          {guide.fix.title}
        </h2>
        <a className="control fix-control" href={`/how#${fix.id}`}>
          Buka panduan
        </a>
      </div>
      <p className="fix-body">{guide.fix.body}</p>
      <p className="fix-meta">{guide.fix.meta}</p>
    </aside>
  )
}

/**
 * Trace: satu-satunya objek non-persegi di halaman. Digambar hanya di ≥1200,
 * karena di bawah itu margin 20px tidak cukup untuk menampung kabel 2px.
 * Tanpa JavaScript, kata-kata tetap membawa seluruh arti.
 */
function Trace({
  columnRef,
  panelRef,
  originRef,
  titleRef,
  enabled,
}: {
  columnRef: RefObject<HTMLElement | null>
  panelRef: RefObject<HTMLElement | null>
  originRef: RefObject<HTMLSpanElement | null>
  titleRef: RefObject<HTMLHeadingElement | null>
  enabled: boolean
}) {
  const [path, setPath] = useState<string | null>(null)

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      setPath(null)
      return
    }

    const column = columnRef.current
    const panel = panelRef.current
    const origin = originRef.current
    const title = titleRef.current
    if (!column || !panel || !origin || !title) {
      setPath(null)
      return
    }

    function measure() {
      if (!column || !panel || !origin || !title) return
      const base = column.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()
      const originRect = origin.getBoundingClientRect()
      const titleRect = title.getBoundingClientRect()

      const startX = originRect.left - base.left
      const startY = originRect.top + originRect.height / 2 - base.top
      const railX = panelRect.left - base.left - 20
      const endY = titleRect.top - base.top + 8
      const endX = titleRect.left - base.left

      setPath(`M ${startX} ${startY} H ${railX} V ${endY} H ${endX}`)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(column)
    observer.observe(panel)
    observer.observe(origin)
    observer.observe(title)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [enabled, columnRef, panelRef, originRef, titleRef])

  if (!path) return null

  return (
    <svg className="trace" aria-hidden="true">
      <path d={path} fill="none" stroke="var(--color-signal)" strokeWidth="2" />
    </svg>
  )
}

export function ReportView({ analysis, analysisId }: { analysis: Analysis; analysisId: string }) {
  const columnRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const originRef = useRef<HTMLSpanElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  const [wide, setWide] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1200px)')
    const update = () => setWide(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const { full, short } = formatAnalyzedAt(analysis.analyzedAt)
  const commit = analysis.commitSha ? analysis.commitSha.slice(0, 7) : null
  const frontier = analysis.frontierLevel
  const frontierResult = frontier
    ? analysis.levels.find((level) => level.level === frontier)
    : null
  const frontierChecks = frontier ? checksAt(analysis, frontier) : []

  const statementLevel = analysis.reachedLevel ? `Level ${analysis.reachedLevel}` : 'Level 1'
  const statementState = analysis.reachedLevel ? 'lulus.' : 'belum lulus.'

  const subline = frontier
    ? `Berikutnya Level ${frontier} — ${frontierResult?.name ?? levelGuide(frontier).name}: ${summaryOf(frontierChecks)}`
    : 'Semua check lulus. Tidak ada yang menahan.'

  const path = `/r/${analysisId}`

  return (
    <div className="report">
      <div className="report-shell">
        <Rail analysis={analysis} />

        <div className="column" ref={columnRef}>
          <header className="statusbar">
            <a className="wordmark phone-only" href="/">
              DEVVERSE
            </a>
            <p className="micro-label quiet desktop-only">LAPORAN KESIAPAN</p>
            <div className="statusbar-right">
              <p className="telemetry">
                {commit ? <span>{commit} · </span> : null}
                <span className="desktop-only">{full}</span>
                <span className="phone-only">{short}</span>
              </p>
              <ShareControl path={path} />
            </div>
          </header>

          <div className="column-inner">
            <div className="phone-only">
              <RepoIdentity analysis={analysis} />
            </div>

            <section className="statement" aria-labelledby="statement-heading">
              <p className="micro-label quiet">STATUS SEKARANG</p>
              <h1 id="statement-heading" className="statement-line">
                <span>{statementLevel}</span>{' '}
                <span className={analysis.reachedLevel ? 'statement-pass' : 'statement-muted'}>
                  {statementState}
                </span>
              </h1>
              <p className="subline">{subline}</p>
            </section>

            <PassedRows analysis={analysis} />

            <FrontierPanel analysis={analysis} panelRef={panelRef} originRef={originRef} />

            <NextFixBand analysis={analysis} titleRef={titleRef} />

            <footer className="report-footer">
              <div>
                <p className="permalink">{path}</p>
                <p>tautan ini bisa dibuka tanpa akun</p>
              </div>
              <div className="report-footer-right">
                <p>tanpa login · tanpa instalasi</p>
                <p className="phone-only">engine v{analysis.engineVersion}</p>
              </div>
            </footer>
          </div>

          <Trace
            columnRef={columnRef}
            panelRef={panelRef}
            originRef={originRef}
            titleRef={titleRef}
            enabled={wide && analysis.nextFix !== null}
          />
        </div>
      </div>

      <PhoneStrip levels={analysis.levels} />
    </div>
  )
}
