import { createFileRoute, notFound } from '@tanstack/react-router'
import { ReportView } from '../components/report-view'
import { guideFor } from '../engine/guide'
import { getReport } from '../server/reports'

export const Route = createFileRoute('/r/$id')({
  loader: async ({ params }) => {
    const analysis = await getReport({ data: params.id })
    if (!analysis) throw notFound()
    return analysis
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: 'Laporan — DEVVERSE' }] }
    }

    const level = loaderData.reachedLevel
      ? `Level ${loaderData.reachedLevel} lulus`
      : 'Level 1 belum lulus'
    const fix = loaderData.nextFix ? guideFor(loaderData.nextFix.id).fix.title : null

    return {
      meta: [
        { title: `${loaderData.repo.fullName} — ${level} — DEVVERSE` },
        {
          name: 'description',
          content: fix
            ? `Laporan kesiapan ${loaderData.repo.fullName}: ${level}. Satu perbaikan berikutnya: ${fix}.`
            : `Laporan kesiapan ${loaderData.repo.fullName}: ${level}.`,
        },
      ],
    }
  },
  component: ReportRoute,
  notFoundComponent: ReportNotFound,
})

function ReportRoute() {
  const analysis = Route.useLoaderData()
  const { id } = Route.useParams()

  return <ReportView analysis={analysis} analysisId={id} />
}

function ReportNotFound() {
  return (
    <main className="simple-page">
      <p className="micro-label quiet">404</p>
      <h1>Laporan tidak ditemukan.</h1>
      <p>
        Tautan ini mungkin salah ketik, atau laporannya sudah dihapus. Analisis ulang
        repository-nya untuk membuat laporan baru.
      </p>
      <a className="control" href="/">
        Kembali ke halaman awal
      </a>
    </main>
  )
}
