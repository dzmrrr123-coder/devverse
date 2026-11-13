import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { getDashboardData } from '../server/dashboard'
import type { DashboardData, SavedProjectItem } from '../server/dashboard'
import { QUICK_ACTIONS } from '../engine/assistant-types'
import type { QuickAction } from '../engine/assistant-types'
import { TimelineView } from '../components/timeline-view'
import type { TimelineMilestone } from '../engine/timeline'
import type { GitHubRepoSummary } from './api/user/repos'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const data = await getDashboardData()
    if (!data) {
      throw redirect({ to: '/login' })
    }
    return { dashboardData: data }
  },
  loader: async ({ context }) => {
    return context.dashboardData
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

  const [projects, setProjects] = useState<SavedProjectItem[]>(data.projects)
  const [selectedProject, setSelectedProject] = useState<SavedProjectItem | null>(
    data.projects[0] ?? null,
  )

  const [colView, setColView] = useState<'projects' | 'timeline' | 'github'>('projects')
  const [timeline, setTimeline] = useState<TimelineMilestone[]>([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  const [gitHubRepos, setGitHubRepos] = useState<GitHubRepoSummary[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)

  useEffect(() => {
    setLoadingRepos(true)
    fetch('/api/user/repos', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.repos)) {
          setGitHubRepos(d.repos)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRepos(false))
  }, [])

  const [apiKey, setApiKey] = useState('')
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [tempKey, setTempKey] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('devverse_gemini_key')
      if (stored) {
        setApiKey(stored)
        setTempKey(stored)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!selectedProject) {
      setTimeline([])
      return
    }
    const parts = selectedProject.repoFullName.split('/')
    if (parts.length < 2) return
    const [owner, repo] = parts

    setLoadingTimeline(true)
    fetch(`/api/projects/timeline?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.timeline)) {
          setTimeline(d.timeline)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTimeline(false))
  }, [selectedProject])

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
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/login'
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
      const headers: Record<string, string> = { 'content-type': 'application/json' }
      if (apiKey.trim()) {
        headers['x-gemini-api-key'] = apiKey.trim()
      }

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        credentials: 'include',
        headers,
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
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`control ${colView === 'projects' ? 'submit-control' : ''}`}
                style={{ padding: '4px 8px', fontSize: '10px' }}
                onClick={() => setColView('projects')}
              >
                PROYEK ({projects.length})
              </button>
              <button
                type="button"
                className={`control ${colView === 'github' ? 'submit-control' : ''}`}
                style={{ padding: '4px 8px', fontSize: '10px' }}
                onClick={() => setColView('github')}
              >
                REPO GITHUB {gitHubRepos.length > 0 ? `(${gitHubRepos.length})` : ''}
              </button>
              <button
                type="button"
                className={`control ${colView === 'timeline' ? 'submit-control' : ''}`}
                style={{ padding: '4px 8px', fontSize: '10px' }}
                onClick={() => setColView('timeline')}
                disabled={!selectedProject}
              >
                TIMELINE {timeline.length > 0 ? `(${timeline.length})` : ''}
              </button>
            </div>
            <span className="project-count-badge">
              {colView === 'projects'
                ? 'WORKSPACE'
                : colView === 'github'
                  ? 'LANGSUNG DARI GITHUB'
                  : selectedProject ? selectedProject.repoFullName : 'PILIH REPO'}
            </span>
          </div>

          {colView === 'projects' ? (
            <>
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
            </>
          ) : colView === 'github' ? (
            <div className="projects-list" role="list">
              {loadingRepos ? (
                <p className="font-label text-xs quiet" style={{ padding: '20px 0', textAlign: 'center' }}>
                  Mengambil repositori dari GitHub akunmu...
                </p>
              ) : gitHubRepos.length === 0 ? (
                <div className="empty-projects">
                  <p className="micro-label signal">REPO TIDAK DITEMUKAN</p>
                  <p>Tidak ada repositori publik yang terdeteksi untuk akun GitHub ini.</p>
                </div>
              ) : (
                gitHubRepos.map((gr) => (
                  <article key={gr.id} className="project-card">
                    <div className="project-card-top">
                      <span className="project-name">{gr.fullName}</span>
                      <span className="font-label text-xs quiet">{gr.language || 'Code'}</span>
                    </div>
                    {gr.description ? (
                      <p className="font-display text-xs quiet" style={{ margin: 0, lineHeight: 1.4 }}>
                        {gr.description}
                      </p>
                    ) : null}
                    <div className="project-card-meta">
                      <span className="quiet">{gr.defaultBranch}</span>
                      <button
                        type="button"
                        className="control submit-control"
                        style={{ padding: '4px 10px', fontSize: '10px' }}
                        onClick={() => {
                          setInputUrl(gr.htmlUrl)
                          setColView('projects')
                        }}
                      >
                        Pilih & Analisis &rarr;
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : (
            <div className="timeline-col-content">
              {loadingTimeline ? (
                <p className="font-label text-xs quiet" style={{ padding: '16px 0' }}>
                  Memuat riwayat commit...
                </p>
              ) : (
                <TimelineView milestones={timeline} />
              )}
            </div>
          )}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="control"
                style={{ padding: '4px 10px', fontSize: '10px' }}
                onClick={() => {
                  setTempKey(apiKey)
                  setShowKeyModal(true)
                }}
              >
                {apiKey ? '🔑 Key Aktif' : '⚙️ Pasang Gemini Key'}
              </button>
              <span
                className="state-square"
                style={{
                  backgroundColor: apiKey ? 'var(--color-pass)' : 'var(--color-signal)',
                  boxShadow: apiKey
                    ? '0 0 10px rgba(99, 217, 198, 0.6)'
                    : '0 0 10px rgba(242, 178, 103, 0.5)',
                }}
                aria-hidden="true"
              />
              <span className={`micro-label ${apiKey ? 'pass' : 'signal'}`}>
                {apiKey ? 'LIVE AI' : 'FALLBACK'}
              </span>
            </div>
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

      {/* Modal Pengaturan Kunci Google Gemini */}
      {showKeyModal ? (
        <div className="modal-backdrop" onClick={() => setShowKeyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="micro-label quiet">PENGATURAN KUNCI GOOGLE GEMINI</p>
                <h3 className="modal-title">Hubungkan AI Langsung.</h3>
              </div>
              <button
                type="button"
                className="control"
                style={{ padding: '4px 8px' }}
                onClick={() => setShowKeyModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-desc">
              Kunci ini disimpan hanya di perambanmu (localStorage), tidak pernah disimpan permanen di server kami,
              dan hanya dikirim ke Google Gemini melalui koneksi terenkripsi.
            </p>

            <div className="login-field">
              <label htmlFor="gemini-key-input" className="micro-label quiet">
                GOOGLE AI STUDIO API KEY
              </label>
              <input
                id="gemini-key-input"
                type="password"
                className="url-input login-input"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="font-label text-xs"
                style={{ color: 'var(--color-signal)', marginTop: '4px', textDecoration: 'none' }}
              >
                Dapatkan API Key gratis di Google AI Studio &rarr;
              </a>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="control submit-control"
                onClick={() => {
                  const trimmed = tempKey.trim()
                  setApiKey(trimmed)
                  try {
                    if (trimmed) {
                      localStorage.setItem('devverse_gemini_key', trimmed)
                    } else {
                      localStorage.removeItem('devverse_gemini_key')
                    }
                  } catch {}
                  setShowKeyModal(false)
                }}
              >
                Simpan Kunci
              </button>
              {apiKey ? (
                <button
                  type="button"
                  className="control"
                  style={{ color: 'var(--color-fail)' }}
                  onClick={() => {
                    setApiKey('')
                    setTempKey('')
                    try {
                      localStorage.removeItem('devverse_gemini_key')
                    } catch {}
                    setShowKeyModal(false)
                  }}
                >
                  Hapus Kunci
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
