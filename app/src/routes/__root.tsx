import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#0B1013' },
      { title: 'DEVVERSE — Laporan Kesiapan Proyek GitHub' },
      {
        name: 'description',
        content:
          'Laporan kesiapan repository GitHub dalam 4 level jujur untuk siswa SMK dan fresh graduate. Tanpa login, tanpa instalasi.',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=Geist+Mono:wght@400..600&family=IBM+Plex+Mono:wght@400..600&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: RootNotFound,
  errorComponent: RootError,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootNotFound() {
  return (
    <main className="simple-page">
      <p className="micro-label quiet">404</p>
      <h1>Halaman tidak ditemukan.</h1>
      <p>
        Alamat yang kamu tuju tidak ada. Periksa kembali URL-nya atau kembali ke halaman utama.
      </p>
      <Link className="control" to="/">
        Kembali ke halaman utama
      </Link>
    </main>
  )
}

function RootError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.'
  return (
    <main className="simple-page">
      <p className="micro-label quiet">KESALAHAN</p>
      <h1>Ada yang tidak beres.</h1>
      <p>{message}</p>
      <Link className="control" to="/">
        Kembali ke halaman utama
      </Link>
    </main>
  )
}
