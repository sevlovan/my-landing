import React, { useEffect, useState } from 'react'
import { Requirement, RequirementVersion } from '../types'

interface HistoryPanelProps {
  requirement: Requirement
  onClose: () => void
}

export function HistoryPanel({ requirement, onClose }: HistoryPanelProps) {
  const [versions, setVersions] = useState<RequirementVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    window.api.req.versions(requirement.id).then(v => {
      setVersions(v)
      setLoading(false)
    })
  }, [requirement.id])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 680, maxHeight: '80vh', background: 'var(--card-bg)', borderRadius: 16,
        boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--gray-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>История изменений</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
              {requirement.req_id} — {requirement.title}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Загрузка...</div>
          ) : versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Нет истории изменений</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {versions.map((v, i) => (
                <div key={v.id} style={{ display: 'flex', gap: 16 }}>
                  {/* Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? 'var(--navy)' : 'var(--gray-300)',
                      border: '2px solid white', boxShadow: '0 0 0 2px ' + (i === 0 ? 'var(--navy)' : 'var(--gray-300)'),
                      marginTop: 6,
                    }} />
                    {i < versions.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: 'var(--gray-200)', margin: '4px 0' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: i < versions.length - 1 ? 20 : 0 }}>
                    <div style={{
                      border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden',
                      cursor: 'pointer',
                    }} onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                      <div style={{
                        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                        background: expanded === v.id ? 'var(--gray-100)' : 'var(--card-bg)',
                      }}>
                        <span style={{
                          background: 'var(--navy)', color: 'white', borderRadius: 6,
                          padding: '1px 7px', fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>v{v.version}</span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--gray-800)' }}>
                            {v.change_comment || (v.version === 1 ? 'Создание' : 'Изменение')}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 1 }}>
                            {v.changed_by} · {formatDate(v.changed_at)}
                          </div>
                        </div>

                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2"
                          style={{ transform: expanded === v.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>

                      {expanded === v.id && (
                        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
                          <VersionDiff version={v} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VersionDiff({ version }: { version: RequirementVersion }) {
  const fields = [
    { key: 'title', label: 'Название', value: version.title },
    { key: 'description', label: 'Описание', value: version.description },
    { key: 'priority', label: 'Приоритет', value: labelMap.priority[version.priority] ?? version.priority },
    { key: 'status', label: 'Статус', value: labelMap.status[version.status] ?? version.status },
    { key: 'author', label: 'Автор', value: version.author },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fields.map(f => (
        <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>{f.label}</span>
          <span style={{ color: 'var(--gray-800)' }}>{f.value || '—'}</span>
        </div>
      ))}
    </div>
  )
}

const labelMap = {
  priority: { high: 'Высокий', medium: 'Средний', low: 'Низкий' } as Record<string, string>,
  status: {
    draft: 'Черновик', approved: 'Согласовано', rejected: 'Отклонено',
    in_review: 'На согласовании', rework: 'На доработке',
  } as Record<string, string>,
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
