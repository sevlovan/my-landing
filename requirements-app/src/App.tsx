import React, { useState } from 'react'
import { Requirement, RequirementType } from './types'
import { useRequirements } from './hooks/useRequirements'
import { Sidebar } from './components/Sidebar'
import { DetailPanel } from './components/DetailPanel'
import { RequirementForm } from './components/RequirementForm'
import { Toolbar } from './components/Toolbar'
import { TableView } from './components/TableView'

type Mode = 'view' | 'create'

export default function App() {
  const { requirements, loading, create, update, remove } = useRequirements()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('view')
  const [createType, setCreateType] = useState<RequirementType>('epic')
  const [createParentId, setCreateParentId] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'tree' | 'table'>('tree')

  const selected = requirements.find(r => r.id === selectedId) ?? null

  const handleNew = (type: RequirementType, parentId?: number) => {
    setCreateType(type)
    setCreateParentId(parentId)
    setMode('create')
    setSelectedId(null)
  }

  const handleSelect = (req: Requirement) => {
    setSelectedId(req.id)
    setMode('view')
  }

  const handleCreate = async (data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>) => {
    const req = await create(data)
    setSelectedId(req.id)
    setMode('view')
  }

  const handleUpdate = async (id: number, data: Partial<Requirement>, changedBy: string, comment: string) => {
    await update(id, data, changedBy, comment)
  }

  const handleDelete = async (id: number) => {
    await remove(id)
    setSelectedId(null)
    setMode('view')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 40, height: 40, border: '3px solid var(--gray-200)',
          borderTopColor: 'var(--navy)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>Загрузка...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        requirements={requirements}
        selectedId={selectedId}
        onSelect={handleSelect}
        onNew={handleNew}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar requirements={requirements} view={view} onViewChange={setView} />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {view === 'tree' ? (
              <TreeMainContent
                requirements={requirements}
                selected={selected}
                onSelect={handleSelect}
              />
            ) : (
              <TableView requirements={requirements} selectedId={selectedId} onSelect={handleSelect} />
            )}
          </div>

          {/* Side panel: detail or create form */}
          {mode === 'create' && (
            <div style={{
              width: 480, flexShrink: 0, background: 'white',
              borderLeft: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column',
              height: '100%', overflow: 'hidden',
            }}>
              <div style={{
                padding: '18px 20px', borderBottom: '1px solid var(--gray-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Новое требование</div>
                <button onClick={() => setMode('view')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                <RequirementForm
                  defaultType={createType}
                  defaultParentId={createParentId}
                  requirements={requirements}
                  onSave={async (data) => { await handleCreate(data) }}
                  onCancel={() => setMode('view')}
                />
              </div>
            </div>
          )}

          {mode === 'view' && selected && (
            <div style={{ width: 420, flexShrink: 0 }}>
              <DetailPanel
                requirement={selected}
                requirements={requirements}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TreeMainContent({
  requirements, selected, onSelect,
}: {
  requirements: Requirement[]
  selected: Requirement | null
  onSelect: (r: Requirement) => void
}) {
  const epics = requirements.filter(r => r.type === 'epic')

  if (requirements.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 16, color: 'var(--gray-400)',
      }}>
        <div style={{ fontSize: 56 }}>📋</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--gray-600)' }}>Нет требований</div>
        <div style={{ fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
          Создайте первый эпик через боковую панель или кнопку «+ Эпик»
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 8 }}>Реестр требований</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 32 }}>Выберите требование для просмотра деталей</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {epics.map(epic => (
            <EpicCard key={epic.id} epic={epic} requirements={requirements} onSelect={onSelect} />
          ))}
        </div>
      </div>
    )
  }

  return null
}

function EpicCard({ epic, requirements, onSelect }: {
  epic: Requirement; requirements: Requirement[]; onSelect: (r: Requirement) => void
}) {
  const features = requirements.filter(r => r.type === 'feature' && r.parent_id === epic.id)
  const totalStories = requirements.filter(r => r.type === 'story' && features.some(f => f.id === r.parent_id)).length

  return (
    <div style={{
      border: '1px solid var(--gray-200)', borderRadius: 12,
      overflow: 'hidden', background: 'white',
    }}>
      {/* Epic header */}
      <div
        onClick={() => onSelect(epic)}
        style={{
          padding: '14px 20px', borderLeft: '4px solid #7c3aed',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          background: 'linear-gradient(to right, #f5f3ff, white)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(to right, #ede9fe, #f9f7ff)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(to right, #f5f3ff, white)'}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>{epic.req_id}</span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{features.length} фич · {totalStories} историй</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-900)', marginTop: 2 }}>{epic.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {['high', 'medium', 'low'].map(p => {
            const count = features.filter(f => f.priority === p).length
            return count > 0 ? (
              <span key={p} style={{
                fontSize: 11, padding: '1px 6px', borderRadius: 99,
                background: p === 'high' ? '#fee2e2' : p === 'medium' ? '#fef3c7' : '#dcfce7',
                color: p === 'high' ? '#dc2626' : p === 'medium' ? '#d97706' : '#16a34a',
                fontWeight: 600,
              }}>{count}</span>
            ) : null
          })}
        </div>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div style={{ paddingLeft: 20 }}>
          {features.map(feature => (
            <FeatureRow key={feature.id} feature={feature} requirements={requirements} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function FeatureRow({ feature, requirements, onSelect }: {
  feature: Requirement; requirements: Requirement[]; onSelect: (r: Requirement) => void
}) {
  const stories = requirements.filter(r => r.type === 'story' && r.parent_id === feature.id)
  const [open, setOpen] = useState(true)

  return (
    <div>
      <div
        style={{
          padding: '10px 16px 10px 16px', borderBottom: '1px solid var(--gray-100)',
          borderLeft: '3px solid #2563eb', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f0f4fe'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0, display: 'flex', visibility: stories.length > 0 ? 'visible' : 'hidden' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div style={{ flex: 1 }} onClick={() => onSelect(feature)}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>{feature.req_id}</span>
          <span style={{ marginLeft: 8, fontWeight: 500, color: 'var(--gray-700)' }}>{feature.title}</span>
          {stories.length > 0 && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--gray-400)' }}>{stories.length} историй</span>}
        </div>
      </div>

      {open && stories.length > 0 && (
        <div style={{ paddingLeft: 32 }}>
          {stories.map(story => (
            <div key={story.id}
              onClick={() => onSelect(story)}
              style={{
                padding: '8px 16px', borderBottom: '1px solid var(--gray-100)',
                borderLeft: '2px solid #16a34a', display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#16a34a', fontWeight: 600 }}>{story.req_id}</span>
              <span style={{ color: 'var(--gray-700)', fontSize: 13 }}>{story.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
