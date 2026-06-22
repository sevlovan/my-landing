import React, { useState, useEffect, useCallback } from 'react'
import { Requirement, RequirementType, TYPE_COLORS, STATUS_LABELS, STATUS_COLORS, SystemRemark, User } from './types'
import { useRequirements } from './hooks/useRequirements'
import { useUsers } from './hooks/useUsers'
import { DetailPanel } from './components/DetailPanel'
import { RequirementForm } from './components/RequirementForm'
import { Toolbar } from './components/Toolbar'
import { TableView } from './components/TableView'
import { AdminPanel } from './components/AdminPanel'
import { SystemRemarksTab } from './components/SystemRemarksTab'

type Mode = 'view' | 'create'

export default function App() {
  const { requirements, loading, create, update, remove } = useRequirements()
  const { users } = useUsers()
  const [showAdmin, setShowAdmin] = useState(false)
  const [selectedISId, setSelectedISId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('view')
  const [createType, setCreateType] = useState<RequirementType>('is')
  const [createParentId, setCreateParentId] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'tree' | 'table'>('tree')
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const selected = requirements.find(r => r.id === selectedId) ?? null
  const selectedIS = requirements.find(r => r.id === selectedISId && r.type === 'is') ?? null

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

  const handleSelectIS = (id: number) => {
    setSelectedISId(id)
    setSelectedId(id)
    setMode('view')
  }

  const handleCreate = async (data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>) => {
    const req = await create(data)
    setSelectedId(req.id)
    if (req.type === 'is') setSelectedISId(req.id)
    setMode('view')
  }

  const handleUpdate = async (id: number, data: Partial<Requirement>, changedBy: string, comment: string) => {
    await update(id, data, changedBy, comment)
  }

  const handleDelete = async (id: number) => {
    const req = requirements.find(r => r.id === id)
    await remove(id)
    setSelectedId(null)
    if (req?.type === 'is') setSelectedISId(null)
    setMode('view')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--gray-200)', borderTopColor: 'var(--navy)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>Загрузка данных...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const isSystems = requirements.filter(r => r.type === 'is')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      <ISSidebar
        systems={isSystems}
        selectedISId={selectedISId}
        onSelect={handleSelectIS}
        onNew={() => handleNew('is')}
        search={search}
        onSearchChange={setSearch}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        onAdminOpen={() => setShowAdmin(true)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar requirements={requirements} view={view} onViewChange={setView} />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {view === 'table' ? (
              <TableView requirements={requirements} selectedId={selectedId} onSelect={handleSelect} />
            ) : selectedIS ? (
              <ISMainContent
                key={selectedIS.id}
                is={selectedIS}
                requirements={requirements}
                selectedId={selectedId}
                onSelect={handleSelect}
                onNew={handleNew}
                users={users}
              />
            ) : (
              <EmptyState onNew={() => handleNew('is')} />
            )}
          </div>

          {mode === 'create' && (
            <div style={{ width: 500, flexShrink: 0, background: 'var(--card-bg)', borderLeft: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Новая запись</div>
                <button onClick={() => setMode('view')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                <RequirementForm
                  defaultType={createType}
                  defaultParentId={createParentId}
                  requirements={requirements}
                  users={users}
                  onSave={async (data) => { await handleCreate(data) }}
                  onCancel={() => setMode('view')}
                />
              </div>
            </div>
          )}

          {mode === 'view' && selected && (
            <DetailPanel
              requirement={selected}
              requirements={requirements}
              users={users}
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

// ── Left sidebar: IS list ──────────────────────────────────────────────────

function ISSidebar({ systems, selectedISId, onSelect, onNew, search, onSearchChange, theme, onThemeToggle, onAdminOpen }: {
  systems: Requirement[]
  selectedISId: number | null
  onSelect: (id: number) => void
  onNew: () => void
  search: string
  onSearchChange: (v: string) => void
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onAdminOpen: () => void
}) {
  const filtered = systems.filter(r =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.req_id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', height: '100vh' }}>
      <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>Управление требованиями</div>
            <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>Реестр систем</div>
          </div>
        </div>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Поиск ИС..."
          style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 12, outline: 'none', color: 'var(--gray-700)', background: 'var(--gray-50)', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 12 }}>
            {search ? 'Не найдено' : 'Нет систем'}
          </div>
        ) : (
          filtered.map(is => (
            <div
              key={is.id}
              onClick={() => onSelect(is.id)}
              style={{
                padding: '10px 12px', cursor: 'pointer',
                borderLeft: `3px solid ${selectedISId === is.id ? TYPE_COLORS.is : 'transparent'}`,
                background: selectedISId === is.id ? 'var(--item-selected)' : 'transparent',
                borderBottom: '1px solid var(--gray-100)',
              }}
              onMouseEnter={e => { if (selectedISId !== is.id) e.currentTarget.style.background = 'var(--gray-50)' }}
              onMouseLeave={e => { e.currentTarget.style.background = selectedISId === is.id ? 'var(--item-selected)' : 'transparent' }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: TYPE_COLORS.is, fontWeight: 700 }}>{is.req_id}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', marginTop: 2, lineHeight: 1.3 }}>{is.title}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: 10, borderTop: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={onNew}
            style={{ flex: 1, padding: '8px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            + Создать ИС
          </button>
          <button onClick={onAdminOpen} title="Управление пользователями"
            style={{ padding: '8px 10px', background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)', flexShrink: 0 }}>
            <GearIcon />
          </button>
          <button onClick={onThemeToggle} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            style={{ padding: '8px 10px', background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)', flexShrink: 0 }}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main content for selected IS ───────────────────────────────────────────

type ISTab = 'architecture' | 'remarks'

function ISMainContent({ is, requirements, selectedId, onSelect, onNew, users }: {
  is: Requirement
  requirements: Requirement[]
  selectedId: number | null
  onSelect: (r: Requirement) => void
  onNew: (type: RequirementType, parentId?: number) => void
  users: User[]
}) {
  const [tab, setTab] = useState<ISTab>('architecture')
  const [systemRemarks, setSystemRemarks] = useState<SystemRemark[]>([])

  const reloadSystemRemarks = useCallback(() => {
    window.api.systemRemark.list(is.id).then(setSystemRemarks).catch(() => {})
  }, [is.id])

  useEffect(() => { reloadSystemRemarks() }, [reloadSystemRemarks])

  const modules = requirements.filter(r => r.type === 'mod' && r.parent_id === is.id)
  const directBF = requirements.filter(r => r.type === 'bf' && r.parent_id === is.id)
  const modBFIds = requirements
    .filter(r => r.type === 'bf' && modules.some(m => m.id === r.parent_id))
    .map(b => b.id)
  const allBFIds = [...directBF.map(b => b.id), ...modBFIds]
  const totalFT = requirements.filter(r => r.type === 'ft' && allBFIds.includes(r.parent_id ?? -1)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* IS header */}
      <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: TYPE_COLORS.is, fontWeight: 700, background: '#f5f3ff', padding: '2px 8px', borderRadius: 5 }}>
                {is.req_id}
              </span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', margin: 0, lineHeight: 1.2 }}>{is.title}</h1>
            {is.description && <p style={{ color: 'var(--gray-500)', margin: '6px 0 0', fontSize: 13, lineHeight: 1.5 }}>{is.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
          <span style={{ color: TYPE_COLORS.mod, fontWeight: 600 }}>{modules.length} модулей</span>
          <span style={{ color: TYPE_COLORS.bf, fontWeight: 600 }}>{allBFIds.length} БФ</span>
          <span style={{ color: TYPE_COLORS.ft, fontWeight: 600 }}>{totalFT} ФТ</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--gray-200)',
        padding: '0 28px', marginTop: 14, flexShrink: 0,
        background: 'var(--gray-50)',
      }}>
        {([
          { key: 'architecture', label: 'Функциональная архитектура' },
          { key: 'remarks', label: `Замечания${systemRemarks.length ? ` (${systemRemarks.length})` : ''}` },
        ] as { key: ISTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
              color: tab === t.key ? 'var(--navy)' : 'var(--gray-500)',
              borderBottom: tab === t.key ? '2px solid var(--navy)' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'architecture' && (
          <div style={{ padding: '20px 28px' }}>
            <CollapsibleSection title="Модули" count={modules.length} color={TYPE_COLORS.mod} onAdd={() => onNew('mod', is.id)} addLabel="+ Модуль">
              {modules.map(mod => (
                <ModuleCard key={mod.id} mod={mod} requirements={requirements} selectedId={selectedId} onSelect={onSelect} onNew={onNew} />
              ))}
              {modules.length === 0 && <EmptyMsg>Нет модулей — функциональные блоки можно добавить напрямую к системе</EmptyMsg>}
            </CollapsibleSection>
            <CollapsibleSection title="Функциональные блоки (прямые)" count={directBF.length} color={TYPE_COLORS.bf} onAdd={() => onNew('bf', is.id)} addLabel="+ БФ">
              {directBF.map(bf => (
                <BFCard key={bf.id} bf={bf} requirements={requirements} selectedId={selectedId} onSelect={onSelect} onNew={onNew} />
              ))}
              {directBF.length === 0 && <EmptyMsg>Нет прямых БФ</EmptyMsg>}
            </CollapsibleSection>
          </div>
        )}
        {tab === 'remarks' && (
          <SystemRemarksTab
            isId={is.id}
            systemRemarks={systemRemarks}
            requirements={requirements}
            users={users}
            onReload={reloadSystemRemarks}
          />
        )}
      </div>
    </div>
  )
}

function CollapsibleSection({ title, count, color, onAdd, addLabel, children }: {
  title: string; count: number; color: string; onAdd: () => void; addLabel: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setOpen(o => !o)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--gray-400)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>{title}</h2>
        <span style={{ fontSize: 11, background: color + '15', color, border: `1px solid ${color}30`, borderRadius: 99, padding: '1px 7px', fontWeight: 600 }}>{count}</span>
        <button onClick={onAdd}
          style={{ marginLeft: 'auto', padding: '3px 10px', border: `1px solid ${color}40`, borderRadius: 99, background: color + '10', color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          {addLabel}
        </button>
      </div>
      {open && <div>{children}</div>}
    </div>
  )
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '8px 14px', color: 'var(--gray-400)', fontSize: 12, fontStyle: 'italic' }}>{children}</div>
}

function ModuleCard({ mod, requirements, selectedId, onSelect, onNew }: {
  mod: Requirement; requirements: Requirement[]
  selectedId: number | null
  onSelect: (r: Requirement) => void
  onNew: (type: RequirementType, parentId?: number) => void
}) {
  const bfItems = requirements.filter(r => r.type === 'bf' && r.parent_id === mod.id)
  const [open, setOpen] = useState(true)

  return (
    <div style={{ border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', marginBottom: 10, background: 'var(--card-bg)' }}>
      <div
        style={{
          padding: '11px 16px', borderLeft: `4px solid ${TYPE_COLORS.mod}`,
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          background: selectedId === mod.id ? 'var(--item-selected)' : 'linear-gradient(to right, var(--gray-50), var(--card-bg))',
        }}
        onClick={() => onSelect(mod)}
        onMouseEnter={e => { if (selectedId !== mod.id) e.currentTarget.style.background = 'var(--item-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = selectedId === mod.id ? 'var(--item-selected)' : 'linear-gradient(to right, var(--gray-50), var(--card-bg))' }}
      >
        <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0, display: 'flex', visibility: bfItems.length > 0 ? 'visible' : 'hidden' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: TYPE_COLORS.mod, fontWeight: 700 }}>{mod.req_id}</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)', marginTop: 1 }}>{mod.title}</div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--gray-400)', flexShrink: 0 }}>{bfItems.length} БФ</span>
        <button onClick={e => { e.stopPropagation(); onNew('bf', mod.id) }}
          style={{ padding: '2px 9px', border: `1px solid ${TYPE_COLORS.bf}40`, borderRadius: 99, background: TYPE_COLORS.bf + '10', color: TYPE_COLORS.bf, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          + БФ
        </button>
      </div>

      {open && bfItems.length > 0 && (
        <div style={{ paddingLeft: 20, background: 'var(--gray-50)' }}>
          {bfItems.map(bf => (
            <BFCard key={bf.id} bf={bf} requirements={requirements} selectedId={selectedId} onSelect={onSelect} onNew={onNew} nested />
          ))}
        </div>
      )}
    </div>
  )
}

function BFCard({ bf, requirements, selectedId, onSelect, onNew, nested }: {
  bf: Requirement; requirements: Requirement[]
  selectedId: number | null
  onSelect: (r: Requirement) => void
  onNew: (type: RequirementType, parentId?: number) => void
  nested?: boolean
}) {
  const ftItems = requirements.filter(r => r.type === 'ft' && r.parent_id === bf.id)
  const [open, setOpen] = useState(true)
  const approvedFT = ftItems.filter(f => f.status === 'approved').length
  const reworkFT = ftItems.filter(f => f.status === 'rework').length
  const draftFT = ftItems.filter(f => f.status === 'draft').length
  const bg = selectedId === bf.id ? 'var(--item-selected)' : 'transparent'

  return (
    <div style={{
      border: nested ? 'none' : '1px solid var(--gray-200)',
      borderRadius: nested ? 0 : 10,
      overflow: 'hidden',
      marginBottom: nested ? 0 : 10,
      background: 'var(--card-bg)',
      borderBottom: '1px solid var(--gray-100)',
    }}>
      <div
        style={{ padding: '10px 14px', borderLeft: `3px solid ${TYPE_COLORS.bf}`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: bg }}
        onClick={() => onSelect(bf)}
        onMouseEnter={e => { if (selectedId !== bf.id) e.currentTarget.style.background = 'var(--item-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = bg }}
      >
        <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 0, display: 'flex', visibility: ftItems.length > 0 ? 'visible' : 'hidden' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: TYPE_COLORS.bf, fontWeight: 700 }}>{bf.req_id}</div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)', marginTop: 1 }}>{bf.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {approvedFT > 0 && <Pill count={approvedFT} label="согл" color="#16a34a" />}
          {reworkFT > 0 && <Pill count={reworkFT} label="дор" color="#ea580c" />}
          {draftFT > 0 && <Pill count={draftFT} label="черн" color="#64748b" />}
        </div>
        <button onClick={e => { e.stopPropagation(); onNew('ft', bf.id) }}
          style={{ padding: '2px 8px', border: `1px solid ${TYPE_COLORS.ft}40`, borderRadius: 99, background: TYPE_COLORS.ft + '10', color: TYPE_COLORS.ft, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          + ФТ
        </button>
      </div>

      {open && ftItems.length > 0 && (
        <div style={{ paddingLeft: 22 }}>
          {ftItems.map(ft => <FTRow key={ft.id} ft={ft} selectedId={selectedId} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  )
}

function FTRow({ ft, selectedId, onSelect }: { ft: Requirement; selectedId: number | null; onSelect: (r: Requirement) => void }) {
  const statusColor = STATUS_COLORS[ft.status] ?? '#64748b'
  const statusLabel = STATUS_LABELS[ft.status] ?? ft.status
  const bg = selectedId === ft.id ? 'var(--item-selected)' : 'transparent'

  return (
    <div
      onClick={() => onSelect(ft)}
      style={{ padding: '7px 12px', borderBottom: '1px solid var(--gray-100)', borderLeft: `2px solid ${TYPE_COLORS.ft}`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: bg }}
      onMouseEnter={e => { if (selectedId !== ft.id) e.currentTarget.style.background = 'var(--item-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.background = bg }}
    >
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: TYPE_COLORS.ft, fontWeight: 700, flexShrink: 0 }}>{ft.req_id}</span>
      <span style={{ color: 'var(--gray-700)', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ft.title}</span>
      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, flexShrink: 0, color: statusColor, background: statusColor + '15', border: `1px solid ${statusColor}30`, fontWeight: 600 }}>
        {statusLabel}
      </span>
    </div>
  )
}

function Pill({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, color, background: color + '15', fontWeight: 600, border: `1px solid ${color}30` }}>
      {count} {label}
    </span>
  )
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: 'var(--gray-400)' }}>
      <div style={{ fontSize: 56 }}>📋</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--gray-600)' }}>Реестр пуст</div>
      <div style={{ fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
        Создайте первую <strong>Информационную систему (ИС)</strong> через кнопку слева
      </div>
      <button onClick={onNew}
        style={{ marginTop: 8, padding: '10px 24px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        + Создать ИС
      </button>
    </div>
  )
}
