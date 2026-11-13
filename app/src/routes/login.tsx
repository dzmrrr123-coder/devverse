import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Masuk dengan GitHub — DEVVERSE' },
      {
        name: 'description',
        content: 'Masuk dengan akun GitHub resmi untuk membuka Dashboard siswa dan Asisten AI.',
      },
    ],
  }),
})

function LoginPage() {
  const { error } = Route.useSearch()

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="micro-label quiet">AUTENTIKASI RESMI</p>
            <span className="state-square is-lulus" aria-hidden="true" />
          </div>

          <h1 className="login-title">Masuk dengan GitHub.</h1>
          <p className="login-desc">
            Devverse terhubung langsung dengan akun GitHub-mu untuk membaca repositori, menilai 10
            check kesiapan, dan memberikan bimbingan Asisten AI secara otomatis.
          </p>

          {error ? (
            <div className="error-banner" role="alert" style={{ margin: '8px 0' }}>
              <span className="state-square is-gagal" aria-hidden="true" />
              <span>
                {error === 'oauth_not_configured'
                  ? 'GitHub OAuth belum dikonfigurasi di server. Pastikan GITHUB_CLIENT_ID dan GITHUB_CLIENT_SECRET terpasang.'
                  : error === 'access_denied'
                    ? 'Otorisasi GitHub dibatalkan.'
                    : error === 'token_failed'
                      ? 'Gagal menukar token otorisasi GitHub. Coba lagi sebentar lagi.'
                      : `Terjadi kendala otentikasi: ${error}`}
              </span>
            </div>
          ) : null}

          {/* SATU-SATUNYA CARA MASUK: GITHUB OAUTH RESMI */}
          <div style={{ marginTop: '12px' }}>
            <a
              href="/api/auth/github"
              className="control submit-control"
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(242, 178, 103, 0.4)',
              }}
            >
              <svg
                height="22"
                viewBox="0 0 16 16"
                version="1.1"
                width="22"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
              <span>Lanjutkan dengan Akun GitHub</span>
            </a>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingTop: '16px',
              borderTop: '1px solid var(--color-hairline)',
              marginTop: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-paper)' }}>
              <span className="state-square is-lulus" aria-hidden="true" />
              <span>Otorisasi aman langsung di server github.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-paper)' }}>
              <span className="state-square is-lulus" aria-hidden="true" />
              <span>Repositori GitHub-mu otomatis tersambung ke Dashboard</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-paper)' }}>
              <span className="state-square is-lulus" aria-hidden="true" />
              <span>Tanpa password terpisah, 100% menggunakan akun GitHub asli</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
