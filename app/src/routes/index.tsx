import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useId, useEffect } from 'react'
import { parseGitHubUrl } from '../github/url'
import { LEVEL_GUIDES } from '../engine/guide'

export const Route = createFileRoute('/')({
  component: IndexPage,
  head: () => ({
    meta: [
      { title: 'DEVVERSE — Laporan Kesiapan Proyek GitHub' },
      {
        name: 'description',
        content:
          'Ketahui kesiapan repository GitHub dalam 4 level jujur untuk siswa SMK dan fresh graduate. Tanpa login, tanpa instalasi.',
      },
    ],
  }),
})

type Stage = 'idle' | 'fetching' | 'evaluating' | 'generating' | 'done' | 'error'

const STAGE_LABELS: Record<Stage, string> = {
  idle: '',
  fetching: '1. Membaca struktur dan berkas repository...',
  evaluating: '2. Menjalankan 10 check kesiapan 4 level...',
  generating: '3. Menyusun laporan tangga dan satu perbaikan...',
  done: 'Selesai. Membuka laporan...',
  error: '',
}

const EXAMPLE_REPOS = [
  { label: 'Absensi QR', url: 'https://github.com/contoh/absensi-qr' },
  { label: 'Bare HTML', url: 'https://github.com/contoh/bare-html' },
  { label: 'Siap Rilis', url: 'https://github.com/contoh/siap-rilis' },
]

function IndexPage() {
  const navigate = useNavigate()
  const inputId = useId()
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Interval stage timer when analyzing to give real human feedback
  useEffect(() => {
    if (stage === 'fetching') {
      const t1 = setTimeout(() => setStage('evaluating'), 700)
      return () => clearTimeout(t1)
    }
    if (stage === 'evaluating') {
      const t2 = setTimeout(() => setStage('generating'), 1100)
      return () => clearTimeout(t2)
    }
  }, [stage])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    const trimmed = url.trim()
    if (!trimmed) {
      setErrorMessage('Tempel URL repository GitHub terlebih dahulu.')
      return
    }

    const parsed = parseGitHubUrl(trimmed)
    if (!parsed) {
      setErrorMessage(
        'Format URL tidak dikenali. Gunakan format https://github.com/owner/repo atau owner/repo.',
      )
      return
    }

    setStage('fetching')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      const data = (await res.json()) as
        | { id: string; url: string }
        | { error: string; message: string; resetAt?: string }

      if (!res.ok || 'error' in data) {
        setStage('error')
        const message = 'message' in data ? data.message : 'Gagal menganalisis repository.'
        setErrorMessage(message)
        return
      }

      setStage('done')
      await navigate({ to: '/r/$id', params: { id: data.id } })
    } catch {
      setStage('error')
      setErrorMessage(
        'Koneksi terputus atau server tidak merespons. Periksa jaringanmu lalu coba lagi.',
      )
    }
  }

  const isAnalyzing = stage === 'fetching' || stage === 'evaluating' || stage === 'generating' || stage === 'done'

  return (
    <div className="entry-page">
      <header className="entry-bar">
        <Link className="wordmark" to="/">
          DEVVERSE
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link className="control" to="/how">
            Arti 10 check
          </Link>
          <Link className="control submit-control" to="/login" style={{ padding: '6px 14px', fontSize: '11px' }}>
            Masuk / Dashboard
          </Link>
        </div>
      </header>

      <main className="entry-shell">
        <section className="entry-hero">
          <p className="micro-label quiet">PROJECT COCKPIT</p>
          <h1 className="entry-title">
            Ketahui kesiapan proyekmu dalam 4 level jujur.
          </h1>
          <p className="entry-lede">
            Tempel tautan repository GitHub publik. Devverse memeriksa README, kode utama,
            kunci rahasia, dependensi, test, CI, hingga lisensi — tanpa login dan tanpa instalasi.
          </p>

          <form className="url-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor={inputId} className="visually-hidden">
              URL Repository GitHub
            </label>
            <div className="url-input-wrap">
              <input
                id={inputId}
                type="text"
                className="url-input"
                placeholder="https://github.com/username/nama-repo"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                  if (stage === 'error') setStage('idle')
                }}
                disabled={isAnalyzing}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className="control submit-control"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Menganalisis...' : 'Analisis'}
              </button>
            </div>

            {isAnalyzing ? (
              <div className="stage-tracker" role="status" aria-live="polite">
                <span className="state-square is-lulus stage-indicator" aria-hidden="true" />
                <span className="stage-text">{STAGE_LABELS[stage]}</span>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="error-banner" role="alert">
                <span className="state-square is-gagal" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="example-row">
              <span className="micro-label quiet">CONTOH:</span>
              {EXAMPLE_REPOS.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  className="example-chip"
                  onClick={() => {
                    setUrl(ex.url)
                    setErrorMessage(null)
                    if (stage === 'error') setStage('idle')
                  }}
                  disabled={isAnalyzing}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </form>
        </section>

        <section className="entry-levels" aria-labelledby="levels-heading">
          <div className="levels-header">
            <h2 id="levels-heading" className="micro-label quiet">
              EMPAT LEVEL KESIAPAN
            </h2>
            <Link className="levels-link" to="/how">
              Lihat 10 check lengkap &rarr;
            </Link>
          </div>

          <ol className="levels-grid">
            {LEVEL_GUIDES.map((guide) => (
              <li key={guide.level} className="level-card">
                <div className="level-card-top">
                  <span className="level-card-number">0{guide.level}</span>
                  <h3 className="level-card-name">{guide.name}</h3>
                </div>
                <p className="level-card-job">{guide.job}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="entry-footer">
          <div>
            <p className="wordmark">DEVVERSE</p>
            <p className="entry-footer-sub">
              Dibuat untuk siswa SMK dan fresh graduate yang ingin portofolio GitHub-nya siap kerja.
            </p>
          </div>
          <div className="entry-footer-links">
            <Link to="/how">Arti 10 check</Link>
            <span>·</span>
            <span>GitHub API publik</span>
            <span>·</span>
            <span>Tanpa login</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
