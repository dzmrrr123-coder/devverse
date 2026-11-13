import { createFileRoute } from '@tanstack/react-router'
import { requireAuth, AuthError } from '../../../server/auth'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export type GitHubRepoSummary = {
  id: number
  name: string
  fullName: string
  htmlUrl: string
  description: string | null
  language: string | null
  defaultBranch: string
  updatedAt: string
}

export const Route = createFileRoute('/api/user/repos')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let user
        try {
          user = await requireAuth(request)
        } catch (err) {
          if (err instanceof AuthError) {
            return json({ error: 'unauthorized', message: err.message }, 401)
          }
          return json({ error: 'unauthorized', message: 'Sesi tidak valid.' }, 401)
        }

        const headers: Record<string, string> = {
          accept: 'application/vnd.github.v3+json',
          'user-agent': 'Devverse-App',
        }

        let url = 'https://api.github.com/user/repos?sort=updated&per_page=20'

        if (user.githubToken) {
          headers['authorization'] = `Bearer ${user.githubToken}`
        } else {
          url = `https://api.github.com/users/${encodeURIComponent(user.username)}/repos?sort=updated&per_page=20`
          if (process.env.GITHUB_TOKEN) {
            headers['authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
          }
        }

        try {
          const res = await fetch(url, { headers })
          if (!res.ok) {
            const errText = await res.text()
            console.warn('Gagal membaca repositori GitHub siswa:', res.status, errText)
            return json({ ok: false, repos: [], message: 'Tidak dapat mengambil repositori dari GitHub.' }, 200)
          }

          const rawList = (await res.json()) as Array<{
            id: number
            name: string
            full_name: string
            html_url: string
            description: string | null
            language: string | null
            default_branch: string
            updated_at: string
          }>

          const repos: GitHubRepoSummary[] = rawList.map((r) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            htmlUrl: r.html_url,
            description: r.description,
            language: r.language,
            defaultBranch: r.default_branch,
            updatedAt: r.updated_at,
          }))

          return json({ ok: true, repos }, 200)
        } catch (err) {
          console.error('Error fetching user repos:', err)
          return json({ ok: false, repos: [], message: 'Koneksi ke GitHub API gagal.' }, 200)
        }
      },
    },
  },
})
