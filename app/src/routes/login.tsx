import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: 'Masuk — DEVVERSE' },
      {
        name: 'description',
        content: 'Masuk ke Devverse untuk membuka Dashboard siswa dan Asisten AI.',
      },
    ],
  }),
})

function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('siswa_smk')
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/dev', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: username.trim() || 'siswa_smk',
          displayName: username === 'siswa_smk' ? 'Rizky Siswa SMK' : username,
        }),
      })

      const data = (await res.json()) as { ok: boolean; message?: string }
      if (!res.ok || !data.ok) {
        setError(data.message || 'Gagal masuk.')
        setLoading(false)
        return
      }

      await navigate({ to: '/dashboard' })
    } catch {
      setError('Koneksi terputus. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="entry-page">
      <header className="entry-bar">
        <Link className="wordmark" to="/">
          DEVVERSE
        </Link>
        <Link className="control" to="/how">
          Arti 10 check
        </Link>
      </header>

      <main className="entry-shell" style={{ maxWidth: '480px', margin: 'auto' }}>
        <section className="login-card">
          <p className="micro-label quiet">AUTENTIKASI SISWA</p>
          <h1 className="login-title">Masuk ke Devverse Cockpit.</h1>
          <p className="login-desc">
            Simpan portofolio proyekmu, pantau riwayat kenaikan level, dan dapatkan bimbingan
            langsung dari Asisten AI untuk pengembangan fitur selanjutnya.
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="username-input" className="micro-label quiet">
                NAMA PENGGUNA / GITHUB USERNAME
              </label>
              <input
                id="username-input"
                type="text"
                className="url-input login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: rizkyfajar"
                disabled={loading}
              />
            </div>

            {error ? (
              <div className="error-banner" role="alert">
                <span className="state-square is-gagal" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <button type="submit" className="control submit-control login-btn" disabled={loading}>
              {loading ? 'Memproses Sesi...' : 'Masuk ke Dashboard Siswa'}
            </button>

            <p className="login-disclaimer">
              Otentikasi aman berbasis sesi bertanda tangan. Sesi ini memberi akses penuh ke Asisten
              AI & Workspace Proyek.
            </p>
          </form>
        </section>
      </main>
    </div>
  )
}
