import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: 'Masuk / Daftar — DEVVERSE' },
      {
        name: 'description',
        content: 'Masuk atau buat akun Devverse untuk membuka Dashboard siswa dan Asisten AI.',
      },
    ],
  }),
})

type AuthTab = 'login' | 'register'

function LoginPage() {
  const [tab, setTab] = useState<AuthTab>('login')
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submitAuth(uname: string, dname?: string) {
    const trimmedUser = uname.trim()
    if (!trimmedUser) {
      setError('Username tidak boleh kosong.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/dev', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUser,
          displayName: dname?.trim() || trimmedUser,
        }),
      })

      const data = (await res.json()) as { ok: boolean; message?: string }
      if (!res.ok || !data.ok) {
        setError(data.message || 'Gagal memproses sesi.')
        setLoading(false)
        return
      }

      window.location.href = '/dashboard'
    } catch {
      setError('Koneksi terputus. Silakan coba lagi.')
      setLoading(false)
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    submitAuth(username, tab === 'register' ? displayName : undefined)
  }

  function handleDemoLogin() {
    setUsername('siswa_smk')
    submitAuth('siswa_smk', 'Rizky Siswa SMK')
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
          <h1 className="login-title">
            {tab === 'login' ? 'Masuk ke Devverse.' : 'Buat Akun Devverse.'}
          </h1>
          <p className="login-desc">
            {tab === 'login'
              ? 'Masukkan username akunmu untuk membuka Dashboard proyek dan Asisten AI.'
              : 'Daftarkan namamu untuk mulai menyimpan portofolio repositori dan bimbingan AI.'}
          </p>

          {/* Tab Selector: Masuk vs Daftar */}
          <div className="auth-tab-bar">
            <button
              type="button"
              className={`auth-tab-btn ${tab === 'login' ? 'is-active' : ''}`}
              onClick={() => {
                setTab('login')
                setError(null)
              }}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${tab === 'register' ? 'is-active' : ''}`}
              onClick={() => {
                setTab('register')
                setError(null)
              }}
            >
              Daftar Baru (Register)
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="login-form">
            {tab === 'register' ? (
              <div className="login-field">
                <label htmlFor="display-name-input" className="micro-label quiet">
                  NAMA LENGKAP / PANGGILAN
                </label>
                <input
                  id="display-name-input"
                  type="text"
                  className="url-input login-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="contoh: Rizky Fajar"
                  disabled={loading}
                />
              </div>
            ) : null}

            <div className="login-field">
              <label htmlFor="username-input" className="micro-label quiet">
                GITHUB USERNAME / NAMA PENGGUNA
              </label>
              <input
                id="username-input"
                type="text"
                className="url-input login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="contoh: rizkyfajar atau nama akunmu"
                disabled={loading}
                autoFocus
              />
            </div>

            {error ? (
              <div className="error-banner" role="alert">
                <span className="state-square is-gagal" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <button type="submit" className="control submit-control login-btn" disabled={loading}>
              {loading
                ? 'Memproses...'
                : tab === 'login'
                  ? 'Masuk ke Dashboard'
                  : 'Daftar & Buka Dashboard'}
            </button>

            <div style={{ textAlign: 'center', paddingTop: '10px', borderTop: '1px solid var(--color-hairline)' }}>
              <button
                type="button"
                className="demo-btn"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                Coba Masuk Cepat: Akun Siswa Demo
              </button>
            </div>

            <p className="login-disclaimer">
              Tanpa kata sandi rumit. Devverse menggunakan sesi terenkripsi aman untuk menyimpan
              portofolio kodemu.
            </p>
          </form>
        </section>
      </main>
    </div>
  )
}
