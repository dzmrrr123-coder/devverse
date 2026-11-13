import type { TimelineMilestone } from '../engine/timeline'
import { guideFor } from '../engine/guide'
import { Link } from '@tanstack/react-router'

function formatTimelineDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(iso)) + ' WIB'
  } catch {
    return iso
  }
}

export function TimelineView({ milestones }: { milestones: TimelineMilestone[] }) {
  if (milestones.length === 0) {
    return (
      <div className="empty-timeline">
        <p className="micro-label quiet">BELUM ADA RIWAYAT COMMIT</p>
        <p>Analisis ulang proyek ini setelah kamu melakukan git push untuk melihat riwayat progres kenaikan level.</p>
      </div>
    )
  }

  return (
    <div className="timeline-container" role="region" aria-label="Riwayat Kenaikan Level per Commit">
      <div className="timeline-track">
        {milestones.map((m, idx) => {
          const isLatest = idx === 0
          const hasLevelUp = m.levelChange > 0
          const shortSha = m.commitSha ? m.commitSha.slice(0, 7) : 'HEAD'

          return (
            <div key={m.analysisId} className={`timeline-item ${isLatest ? 'is-latest' : ''}`}>
              {/* Node Marker */}
              <div className="timeline-node">
                <span
                  className={`node-dot ${hasLevelUp ? 'is-levelup' : isLatest ? 'is-active' : 'is-past'}`}
                  aria-hidden="true"
                />
              </div>

              {/* Milestone Content Card */}
              <div className="timeline-card">
                <div className="milestone-top">
                  <div className="milestone-sha-group">
                    <span className="sha-pill">{shortSha}</span>
                    {isLatest ? <span className="latest-pill micro-label signal">TERBARU</span> : null}
                    {hasLevelUp ? (
                      <span className="levelup-pill micro-label pass">
                        +{m.levelChange} LEVEL NAIK 🚀
                      </span>
                    ) : null}
                  </div>
                  <time className="milestone-time font-label text-xs quiet">
                    {formatTimelineDate(m.analyzedAt)}
                  </time>
                </div>

                <div className="milestone-body">
                  <p className="milestone-level">
                    <span className="quiet">Capaian:</span>{' '}
                    <strong>{m.reachedLevel ? `Level ${m.reachedLevel} Lulus` : 'Level 1 Belum'}</strong>
                  </p>

                  {/* Fixed Checks in this commit */}
                  {m.fixedChecks.length > 0 ? (
                    <div className="milestone-diff is-fixed">
                      <span className="diff-label micro-label pass">BERHASIL DIPERBAIKI:</span>
                      <ul className="diff-list">
                        {m.fixedChecks.map((cid) => (
                          <li key={cid}>
                            <span className="state-square is-lulus" aria-hidden="true" />
                            <span>{guideFor(cid).name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* Regressed Checks */}
                  {m.regressedChecks.length > 0 ? (
                    <div className="milestone-diff is-regressed">
                      <span className="diff-label micro-label fail">PERLU PERHATIAN:</span>
                      <ul className="diff-list">
                        {m.regressedChecks.map((cid) => (
                          <li key={cid}>
                            <span className="state-square is-gagal" aria-hidden="true" />
                            <span>{guideFor(cid).name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="milestone-footer">
                  <Link to="/r/$id" params={{ id: m.analysisId }} className="control text-xs">
                    Buka Laporan Commit Ini &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
