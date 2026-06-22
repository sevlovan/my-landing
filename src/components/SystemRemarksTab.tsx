import React, { useState, useEffect } from 'react'
import { SystemRemark, Requirement, User } from '../types'
import { UserSelect } from './UserSelect'

const PRIORITY_COLORS: Record<string, string> = {
  high: '#dc2626', medium: '#d97706', low: '#16a34a',
}
const PRIORITY_LABELS_RU: Record<string, string> = {
  high: 'Высокий', medium: 'Средний', low: 'Низкий',
}
const SYS_STATUS_COLORS: Record<string, string> = {
  open: '#dc2626', in_progress: '#d97706', resolved: '#2563eb', closed: '#64748b',
}
const SYS_STATUS_LABELS: Record<string, string> = {
  open: 'Открыто', in_progress: 'В работе', resolved: 'Решено', closed: 'Закрыто',
}

export function SystemRemarksTab({ isId, systemRemarks, requirements, users, onReload }: {
  isId: number
  systemRemarks: SystemRemark[]
  requirements: Requirement[]
  users: User[]
  onReload: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const mods = requirements.filter(r => r.type === 'mod' && r.parent_id === isId)
  const modIds = new Set(mods.map(m => m.id))
  const bfs = requirements.filter(r => r.type === 'bf' && r.parent_id !== null && (r.parent_id === isId || modIds.has(r.parent_id)))
  const moduleOptions = [...mods, ...bfs]

  const emptyForm: Omit<SystemRemark, 'id' | 'created_at' | 'updated_at'> = {
    is_id: isId, title: '', description: '', module_id: null,
    priority: 'medium', status: 'open', author: '',
  }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await window.api.systemRemark.create(form)
      setForm(emptyForm); setAdding(false); onReload()
    } finally { setSaving(false) }
  }

  const handleUpdate = async (id: number, data: Partial<SystemRemark>) => {
    await window.api.systemRemark.update(id, data)
    setEditingId(null); onReload()
  }

  const handleDelete = async (id: number) => {
    await window.api.systemRemark.delete(id); onReload()
  }

  const moduleLabel = (id: number | null) => {
    if (!id) return null
    const r = requirements.find(x => x.id === id)
    return r ? `${r.req_id} — ${r.title}` : null
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
          Замечания к системе ({systemRemarks.length})
        </span>
        <button onClick={() => { setAdding(a => !a); if (adding) setForm(emptyForm) }}
          style={{
            padding: '6px 14px', border: '1px solid var(--gray-200)', borderRadius: 7,
            background: adding ? 'var(--gray-100)' : 'var(--card-bg)', fontSize: 13, fontWeight: 600,
            color: 'var(--navy)', cursor: 'pointer',
          }}>
          {adding ? '✕ Отмена' : '+ Добавить'}
        </button>
      </div>

      {adding && (
        <SysRemarkForm
          form={form}
          setForm={setForm}
          moduleOptions={moduleOptions}
          users={users}
          saving={saving}
          onSave={handleAdd}
          onCancel={() => { setAdding(false); setForm(emptyForm) }}
        />
      )}

      {systemRemarks.length === 0 && !adding ? (
        <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 14, padding: '48px 0' }}>
          Замечания к системе отсутствуют
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {systemRemarks.map(r => (
            <SystemRemarkCard
              key={r.id}
              remark={r}
              moduleOptions={moduleOptions}
              users={users}
              moduleLabel={moduleLabel}
              isEditing={editingId === r.id}
              onEdit={() => setEditingId(r.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={data => handleUpdate(r.id, data)}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SysRemarkForm({ form, setForm, moduleOptions, users, saving, onSave, onCancel }: {
  form: Omit<SystemRemark, 'id' | 'created_at' | 'updated_at'>
  setForm: React.Dispatch<React.SetStateAction<Omit<SystemRemark, 'id' | 'created_at' | 'updated_at'>>>
  moduleOptions: Requirement[]
  users: User[]
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div style={{
      background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
      borderRadius: 10, padding: 16, marginBottom: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <Field label="Заголовок *">
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Краткое описание замечания" style={inputSm} autoFocus />
      </Field>
      <Field label="Описание">
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Подробное описание..." rows={3} style={{ ...inputSm, resize: 'vertical' }} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Модуль / ФБ (опционально)">
          <select value={form.module_id ?? ''} onChange={e => setForm(f => ({ ...f, module_id: Number(e.target.value) || null }))} style={inputSm}>
            <option value="">— не указан —</option>
            {moduleOptions.map(m => <option key={m.id} value={m.id}>{m.req_id} — {m.title}</option>)}
          </select>
        </Field>
        <Field label="Автор">
          <UserSelect value={form.author} onChange={v => setForm(f => ({ ...f, author: v }))} users={users} placeholder="выберите автора" style={inputSm} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Приоритет">
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as SystemRemark['priority'] }))} style={inputSm}>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </Field>
        <Field label="Статус">
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SystemRemark['status'] }))} style={inputSm}>
            <option value="open">Открыто</option>
            <option value="in_progress">В работе</option>
            <option value="resolved">Решено</option>
            <option value="closed">Закрыто</option>
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel}
          style={{ padding: '6px 16px', border: '1px solid var(--gray-300)', borderRadius: 7, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 13 }}>
          Отмена
        </button>
        <button onClick={onSave} disabled={saving || !form.title.trim()}
          style={{
            padding: '6px 16px', border: 'none', borderRadius: 7,
            background: 'var(--navy)', color: 'white', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, opacity: saving || !form.title.trim() ? 0.6 : 1,
          }}>
          {saving ? 'Сохранение...' : 'Добавить'}
        </button>
      </div>
    </div>
  )
}

function SystemRemarkCard({ remark, moduleOptions, users, moduleLabel, isEditing, onEdit, onCancelEdit, onSaveEdit, onDelete }: {
  remark: SystemRemark
  moduleOptions: Requirement[]
  users: User[]
  moduleLabel: (id: number | null) => string | null
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (data: Partial<SystemRemark>) => void
  onDelete: () => void
}) {
  const [editForm, setEditForm] = useState<Partial<SystemRemark>>({})

  useEffect(() => {
    if (isEditing) {
      setEditForm({ title: remark.title, description: remark.description, module_id: remark.module_id, priority: remark.priority, status: remark.status, author: remark.author })
    }
  }, [isEditing, remark])

  const modLabel = moduleLabel(remark.module_id)

  if (isEditing) {
    return (
      <div style={{
        border: '1px solid var(--gray-200)', borderRadius: 10, padding: 14,
        borderLeft: `3px solid ${SYS_STATUS_COLORS[remark.status] ?? '#64748b'}`,
        display: 'flex', flexDirection: 'column', gap: 10,
        background: 'var(--gray-50)',
      }}>
        <Field label="Заголовок *">
          <input value={editForm.title ?? ''} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={inputSm} autoFocus />
        </Field>
        <Field label="Описание">
          <textarea value={editForm.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            rows={3} style={{ ...inputSm, resize: 'vertical' }} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Модуль / ФБ">
            <select value={editForm.module_id ?? ''} onChange={e => setEditForm(f => ({ ...f, module_id: Number(e.target.value) || null }))} style={inputSm}>
              <option value="">— не указан —</option>
              {moduleOptions.map(m => <option key={m.id} value={m.id}>{m.req_id} — {m.title}</option>)}
            </select>
          </Field>
          <Field label="Автор">
            <UserSelect value={editForm.author ?? ''} onChange={v => setEditForm(f => ({ ...f, author: v }))} users={users} placeholder="выберите" style={inputSm} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Приоритет">
            <select value={editForm.priority ?? 'medium'} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as SystemRemark['priority'] }))} style={inputSm}>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </Field>
          <Field label="Статус">
            <select value={editForm.status ?? 'open'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as SystemRemark['status'] }))} style={inputSm}>
              <option value="open">Открыто</option>
              <option value="in_progress">В работе</option>
              <option value="resolved">Решено</option>
              <option value="closed">Закрыто</option>
            </select>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancelEdit}
            style={{ padding: '5px 14px', border: '1px solid var(--gray-300)', borderRadius: 7, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 13, color: 'var(--gray-700)' }}>
            Отмена
          </button>
          <button onClick={() => onSaveEdit(editForm)} disabled={!editForm.title?.trim()}
            style={{ padding: '5px 14px', border: 'none', borderRadius: 7, background: 'var(--navy)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Сохранить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      border: '1px solid var(--gray-200)', borderRadius: 10, padding: 14,
      borderLeft: `3px solid ${SYS_STATUS_COLORS[remark.status] ?? '#64748b'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
            color: SYS_STATUS_COLORS[remark.status], background: (SYS_STATUS_COLORS[remark.status] ?? '#64748b') + '15',
            border: `1px solid ${(SYS_STATUS_COLORS[remark.status] ?? '#64748b')}30`,
          }}>
            {SYS_STATUS_LABELS[remark.status] ?? remark.status}
          </span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
            color: PRIORITY_COLORS[remark.priority], background: (PRIORITY_COLORS[remark.priority] ?? '#64748b') + '15',
            border: `1px solid ${(PRIORITY_COLORS[remark.priority] ?? '#64748b')}30`,
          }}>
            {PRIORITY_LABELS_RU[remark.priority] ?? remark.priority}
          </span>
          {remark.author && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{remark.author}</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={onEdit} title="Редактировать"
            style={{ padding: '3px 8px', border: '1px solid var(--gray-200)', borderRadius: 5, background: 'var(--card-bg)', cursor: 'pointer', color: 'var(--gray-500)', display: 'flex', alignItems: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={onDelete} title="Удалить"
            style={{ padding: '3px 8px', border: '1px solid #fca5a5', borderRadius: 5, background: '#fff5f5', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>
            ✕
          </button>
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)', marginBottom: 4 }}>{remark.title}</div>
      {modLabel && (
        <div style={{ fontSize: 12, color: 'var(--navy)', marginBottom: 6, fontWeight: 500 }}>{modLabel}</div>
      )}
      {remark.description && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>{remark.description}</p>
      )}
      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>{fmtDate(remark.created_at)}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-600)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputSm: React.CSSProperties = {
  width: '100%', padding: '7px 10px',
  border: '1px solid var(--gray-200)', borderRadius: 7,
  fontSize: 13, outline: 'none', color: 'var(--gray-800)',
  background: 'var(--card-bg)', boxSizing: 'border-box',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
