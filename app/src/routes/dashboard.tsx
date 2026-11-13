import { createFileRoute, redirect, useNavigate, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { getDashboardData } from '../server/dashboard'
import type { DashboardData, SavedProjectItem } from '../server/dashboard'
import { QUICK_ACTIONS } from '../engine/assistant-types'
import type { QuickAction } from '../engine/assistant-types'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    // Check session on server
    const data = await getDashboardData()
    if (!data) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const data = await getDashboardData()
    if (!data) throw redirect({ to: '/login' })
    return data
  },
  head: () => ({
    meta: [
      { title: 'Dashboard Siswa & Asisten AI — DEVVERSE' },
      {
        name: 'description',
        content: 'Cockpit portofolio proyek dan studio bimbingan Asisten AI Devverse.',
      },
    ],
  }),
  component: DashboardPage,
})

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function DashboardPage() {
  const data = Route.useLoaderData() as DashboardData
  const navigate = useNavigate()

  const [projects, setProjects] = useState<SavedProjectItem[]>(data.projects)
  const [selectedProject, setSelectedProject] = useState<SavedProjectItem | null>(
    data.projects[0] ?? null,
  )

  const [messages, setMessages] = useState<ChatMessage[]>(
    data.recentChats.map((c) => ({
      id: c.id,
      role: c.role,
      content: c.content,
    })),
  )

  const [inputUrl, setInputUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const [chatPrompt, setChatPrompt] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    await navigate({ to: '/login' })
  }

  async function handleAnalyzeAndSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputUrl.trim()
    if (!trimmed) return

    setAnalyzing(true)
    setAnalyzeError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      const analyzeResult = (await res.json()) as
        | { id: string; url: string }
        | { error: string; message: string }

      if (!res.ok || 'error' in analyzeResult) {
        setAnalyzeError('message' in analyzeResult ? analyzeResult.message : 'Analisis gagal.')
        setAnalyzing(false)
        return
      }

      // Add to local state and select it
      const newProject: SavedProjectItem = {
        id: analyzeResult.id,
        analysisId: analyzeResult.id,
        repoFullName: trimmed.replace(/^https?:\/\/github\.com\//, ''),
        repoUrl: trimmed.startsWith('http') ? trimmed : `https://github.com/${trimmed}`,
        reachedLevel: 1,
        frontierLevel: 1,
        analyzedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
      }

      setProjects((prev) => [newProject, ...prev])
      setSelectedProject(newProject)
      setInputUrl('')
      setAnalyzing(false)
    } catch {
      setAnalyzeError('Koneksi terputus saat menganalisis.')
      setAnalyzing(false)
    }
  }

  async function sendAssistantMessage(action?: QuickAction, customPrompt?: string) {
    const promptToSend = customPrompt || (action ? QUICK_ACTIONS[action].prompt : chatPrompt)
    if (!promptToSend.trim() || chatLoading) return

    const userMsgId = `u_${Date.now()}`
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: promptToSend,
    }

    setMessages((prev) => [...prev, userMsg])
    if (!action) setChatPrompt('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: action ?? 'general_chat',
          prompt: promptToSend,
          analysisId: selectedProject?.analysisId ?? null,
        }),
      })

      const responseData = (await res.json()) as
        | { ok: true; reply: string }
        | { error: string; message: string }

      if (!res.ok || 'error' in responseData) {
        const errText = 'message' in responseData ? responseData.message : 'Gagal memproses jawaban.'
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: `Maaf, terjadi kendala: ${errText}`,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            role: 'assistant',
            content: responseData.reply,
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Koneksi ke asisten AI terputus. Silakan coba lagi.',
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="dashboard-shell">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <Link to="/" className="wordmark">
            DEVVERSE
          </Link>
          <span className="micro-label quiet desktop-only">STUDENT COCKPIT</span>
        </div>

        <div className="dashboard-user">
          <div className="user-badge">
            <span className="state-square is-lulus" aria-hidden="true" />
            <span className="user-name">{data.user.displayName || data.user.username}</span>
            <span className="micro-label quiet desktop-only">@{data.user.username}</span>
          </div>
          <button type="button" className="control logout-btn" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </header>

      {/* Main Two-Column Workspace */}
      <main className="dashboard-workspace">
        {/* Kolom Kiri: Portofolio Proyek */}
        <section className="dashboard-col projects-col" aria-labelledby="projects-heading">
          <div className="col-header">
            <h2 id="projects-heading" className="micro-label quiet">
              WORKSPACE REPOSITORY
            </h2>
            <span className="project-count-badge">{projects.length} PROYEK</span>
          </div>

          {/* Form Tambah Repo */}
          <form onSubmit={handleAnalyzeAndSave} className="add-project-form">
            <div className="url-input-wrap">
              <input
                type="text"
                className="url-input"
                placeholder="https://github.com/user/nama-repo"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                disabled={analyzing}
              />
              <button type="submit" className="control submit-control" disabled={analyzing}>
                {analyzing ? 'Menilai...' : 'Tambah'}
              </button>
            </div>
            {analyzeError ? (
              <p className="error-banner" style={{ margin: 0 }}>
                {analyzeError}
              </p>
            ) : null}
          </form>

          {/* Daftar Proyek */}
          <div className="projects-list" role="list">
            {projects.length === 0 ? (
              <div className="empty-projects">
                <p className="micro-label quiet">BELUM ADA REPO</p>
                <p>Tempel tautan GitHub-mu di atas untuk memantau level kesiapan portofoliomu.</p>
              </div>
            ) : (
              projects.map((proj) => {
                const isSelected = selectedProject?.id === proj.id
                return (
                  <article
                    key={proj.id}
                    className={`project-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedProject(proj)}
                  >
                    <div className="project-card-top">
                      <span className="project-name">{proj.repoFullName}</span>
                      <span
                        className={`state-square ${
                          proj.reachedLevel && proj.reachedLevel >= 1 ? 'is-lulus' : 'is-gagal'
                        }`}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="project-card-meta">
                      <span className="project-level">
                        {proj.reachedLevel ? `Level ${proj.reachedLevel} Lulus` : 'Level 1 Belum'}
                      </span>
                      <div className="project-actions">
                        <Link
                          to="/r/$id"
                          params={{ id: proj.analysisId }}
                          className="control text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Laporan Lengkap &rarr;
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>

        {/* Kolom Kanan: Studio Asisten AI */}
        <section className="dashboard-col assistant-col" aria-labelledby="assistant-heading">
          <div className="col-header">
            <div className="assistant-title-group">
              <h2 id="assistant-heading" className="micro-label quiet">
                STUDIO ASISTEN AI
              </h2>
              {selectedProject ? (
                <span className="context-pill">Konteks: {selectedProject.repoFullName}</span>
              ) : (
                <span className="context-pill">Konteks: Umum</span>
              )}
            </div>
            <span className="micro-label signal">ONLINE</span>
          </div>

          {/* Tombol Aksi Cepat (Termasuk yang diminta human) */}
          <div className="quick-actions-bar" aria-label="Aksi Cepat Asisten AI">
            <button
              type="button"
              className="quick-btn"
              onClick={() => sendAssistantMessage('draft_readme')}
              disabled={chatLoading}
            >
              Draf README Proyek
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => sendAssistantMessage('draft_ci')}
              disabled={chatLoading}
            >
              Draf GitHub Actions CI
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => sendAssistantMessage('draft_env')}
              disabled={chatLoading}
            >
              Draf .env.example
            </button>
            <button
              type="button"
              className="quick-btn highlight-btn"
              onClick={() => sendAssistantMessage('analyze_roadmap')}
              disabled={chatLoading}
            >
              Analisa lah projek ku untuk pengembangan selanjutnya
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="chat-log" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p className="micro-label signal">BENGKEL AI DEVVERSE</p>
                <h3 className="empty-chat-title">Siap membantu proyekmu naik level.</h3>
                <p className="empty-chat-desc">
                  Pilih salah satu tombol aksi cepat di atas untuk langsung men-generate draf berkas
                  atau minta analisa pengembangan fitur selanjutnya.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-bubble ${msg.role === 'user' ? 'is-user' : 'is-assistant'}`}
                >
                  <p className="chat-role micro-label quiet">
                    {msg.role === 'user' ? 'KAMU' : 'ASISTEN AI'}
                  </p>
                  <div className="chat-content">
                    <pre className="chat-text">{msg.content}</pre>
                  </div>
                </div>
              ))
            )}

            {chatLoading ? (
              <div className="chat-bubble is-assistant chat-thinking">
                <p className="chat-role micro-label signal">ASISTEN AI</p>
                <p className="thinking-text">
                  <span className="state-square is-lulus stage-indicator" aria-hidden="true" />{' '}
                  Sedang menganalisa dan merumuskan jawaban terbaik...
                </p>
              </div>
            ) : null}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendAssistantMessage()
            }}
            className="chat-input-form"
          >
            <input
              type="text"
              className="url-input chat-input-field"
              placeholder="Ketik pertanyaan untuk Asisten AI (misal: 'Gimana cara bikin unit test?')..."
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              disabled={chatLoading}
            />
            <button type="submit" className="control submit-control" disabled={chatLoading || !chatPrompt.trim()}>
              Kirim
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
