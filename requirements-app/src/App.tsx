import React, { useState } from 'react'
import { Requirement, RequirementType, TYPE_COLORS, STATUS_LABELS, STATUS_COLORS } from './types'
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
  const [createType, setCreateType] = useState<RequirementType>('is')
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
        <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>Загрузка данных...</div>
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar requirements={requirements} view={view} onViewChange={setView} />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {view === 'tree' ? (
              <TreeMainContent
                requirements={requirements}
                selected={selected}
                onSelect={handleSelect}
                onNew={handleNew}
              />
            ) : (
              <TableView requirements={requirements} selectedId={selectedId} onSelect={handleSelect} />
            )}
          </div>

          {/* Create panel */}
          {mode === 'create' && (
            <div style={{
              width: 500, flexShrink: 0, background: 'white',
              borderLeft: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column',
              height: '100%', overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--gray-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Новая запись</div>
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

          {/* Detail panel */}
          {mode === 'view' && selected && (
            <DetailPanel
              requirement={selected}
              requirements={requirements}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function TreeMainContent({
  requirements, selected, onSelect, onNew,
}: {
  requirements: Requirement[]
  selected: Requirement | null
  onSelect: (r: Requirement) => void
  onNew: (type: RequirementType, parentId?: number) => void
}) {
  const isSystems = requirements.filter(r => r.type === 'is')

  if (requirements.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 16, color: 'var(--gray-400)',
      }}>
        <div style={{ fontSize: 56 }}>📋</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--gray-600)' }}>Реестр пуст</div>
        <div style={{ fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
          Создайте первую <strong>Информационную систему (ИС)</strong> через левую панель или кнопку «+ ИС»
        </div>
        <button
          onClick={() => onNew('is')}
          style={{
            marginTop: 8, padding: '10px 24px', background: 'var(--navy)', color: 'white',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
          + Создать ИС
        </button>
      </div>
    )
  }

  if (!selected) {
    return (
      <div style={{ padding: 28, overflowY: 'auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 4 }}>
          Реестр требований СУИД
        </h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 28, fontSize: 13 }}>
          Выберите элемент для просмотра деталей
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSystems.map(is => (
            <ISCard key={is.id} is={is} requirements={requirements} onSelect={onSelect} onNew={onNew} />
          ))}
        </div>
      </div>
    )
  }

  return null
}

function ISCard({ is, requirements, onSelect, onNew }: {
  is: Requirement; requirements: Requirement[]
  onSelect: (r: Requirement) => void
  onNew: (type: RequirementType, parentId?: number) => void
}) {
  const bfBlocks = requirements.filter(r => r.type === 'bf' && r.parent_id === is.id)
  const ftItems = requirements.filter(r => r.type === 'ft' && bfBlocks.some(bf => bf.id === r.parent_id))
  const [open, setOpen] = useState(true)

  const approvedFT = ftItems.filter(f => f.status === 'approved').length
  const reworkFT = ftItems.filter(f => f.status === 'rework').length
  const draftFT = ftItems.filter(f => f.status === 'draft').length

  return (
    <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
      {/* IS header */}
      <div
        onClick={() => onSelect(is)}
        style={{
          padding: '14px 20px', borderLeft: `4px solid ${TYPE_COLORS.is}`,
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          background: 'linear-gradient(to right, #f5f3ff, white)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(to right, #ede9fe, #f9f7ff)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(to right, #f5f3ff, white)'}
      >
        <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0, display: 'flex', visibility: bfBlocks.length > 0 ? 'visible' : 'hidden' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: TYPE_COLORS.is, fontWeight: 700 }}>{is.req_id}</span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              {bfBlocks.length} БФ · {ftItems.length} ФТ
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-900)', marginTop: 2 }}>{is.title}</div>
        </div>

        <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {approvedFT > 0 && <StatPill count={approvedFT} label="согл" color="#16a34a" />}
          {reworkFT > 0 && <StatPill count={reworkFT} label="дор" color="#ea580c" />}
          {draftFT > 0 && <StatPill count={draftFT} label="черн" color="#64748b" />}
          <button onClick={e => { e.stopPropagation(); onNew('bf', is.id) }}
            style={{
              padding: '2px 9px', border: `1px solid ${TYPE_COLORS.bf}40`, borderRadius: 99,
              background: TYPE_COLORS.bf + '10', color: TYPE_COLORS.bf, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>
            + БФ
          </button>
        </div>
      </div>

      {/* BF blocks */}
      {open && bfBlocks.length > 0 && (
        <div style={{ paddingLeft: 20 }}>
          {bfBlocks.map(bf => (
            <BFRow key={bf.id} bf={bf} requirements={requirements} onSelect={onSelect} onNew={onNew} />
          ))}
        </div>
      )}
    </div>
  )
}

function BFRow({ bf, requirements, onSelect, onNew }: {
  bf: Requirement; requirements: Requirement[]
  onSelect: (r: Requirement) => void
  onNew: (type: RequirementType, parentId?: number) => void
}) {
  const ftItems = requirements.filter(r => r.type === 'ft' && r.parent_id === bf.id)
  const [open, setOpen] = useState(true)

  return (
    <div>
      <div
        style={{
          padding: '10px 16px', borderBottom: '1px solid var(--gray-100)',
          borderLeft: `3px solid ${TYPE_COLORS.bf}`, display: 'flex', alignItems: 'center', gap: 10,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f0f4fe'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0, display: 'flex', visibility: ftItems.length > 0 ? 'visible' : 'hidden' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onSelect(bf)}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: TYPE_COLORS.bf, fontWeight: 700 }}>{bf.req_id}</span>
          <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--gray-700)', fontSize: 14 }}>{bf.title}</span>
          {ftItems.length > 0 && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--gray-400)' }}>{ftItems.length} ФТ</span>}
        </div>

        <button onClick={e => { e.stopPropagation(); onNew('ft', bf.id) }}
          style={{
            padding: '2px 8px', border: `1px solid ${TYPE_COLORS.ft}40`, borderRadius: 99,
            background: TYPE_COLORS.ft + '10', color: TYPE_COLORS.ft, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0,
          }}>
          + ФТ
        </button>
      </div>

      {open && ftItems.length > 0 && (
        <div style={{ paddingLeft: 32 }}>
          {ftItems.map(ft => (
            <FTRow key={ft.id} ft={ft} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function FTRow({ ft, onSelect }: { ft: Requirement; onSelect: (r: Requirement) => void }) {
  const statusColor = STATUS_COLORS[ft.status] ?? '#64748b'
  const statusLabel = STATUS_LABELS[ft.status] ?? ft.status

  return (
    <div
      onClick={() => onSelect(ft)}
      style={{
        padding: '8px 12px', borderBottom: '1px solid var(--gray-100)',
        borderLeft: `2px solid ${TYPE_COLORS.ft}`, display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: TYPE_COLORS.ft, fontWeight: 700, flexShrink: 0 }}>{ft.req_id}</span>
      <span style={{ color: 'var(--gray-700)', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ft.title}</span>
      <span style={{
        fontSize: 10, padding: '1px 7px', borderRadius: 99, flexShrink: 0,
        color: statusColor, background: statusColor + '15',
        border: `1px solid ${statusColor}30`, fontWeight: 600,
      }}>
        {statusLabel}
      </span>
    </div>
  )
}

function StatPill({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <span style={{
      fontSize: 11, padding: '1px 7px', borderRadius: 99,
      color, background: color + '15', fontWeight: 600,
      border: `1px solid ${color}30`,
    }}>
      {count} {label}
    </span>
  )
}
