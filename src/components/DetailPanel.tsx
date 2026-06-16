import React, { useState, useEffect } from 'react'
import { Requirement, Remark, Approval, STATUS_LABELS, STATUS_COLORS, TYPE_LONG_LABELS, User, SystemRemark } from '../types'
import { Badge } from './Badge'
import { RequirementForm } from './RequirementForm'
import { HistoryPanel } from './HistoryPanel'
import { UserSelect } from './UserSelect'

interface DetailPanelProps {
  requirement: Requirement
  requirements: Requirement[]
  users?: User[]
  onUpdate: (id: number, data: Partial<Requirement>, changedBy: string, comment: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onClose: () => void
}

type Tab = 'info' | 'remarks' | 'approval' | 'sys_remarks'

export function DetailPanel({ requirement, requirements, users = [], onUpdate, onDelete, onClose }: DetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState<Tab>('info')

  const [remarks, setRemarks] = useState<Remark[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [systemRemarks, setSystemRemarks] = useState<SystemRemark[]>([])

  const isFT = requirement.type === 'ft'
  const isIS = requirement.type === 'is'

  useEffect(() => {
    setEditing(false)
    setTab('info')
    if (isFT) {
      window.api.remark.list(requirement.id).then(setRemarks).catch(() => {})
      window.api.approval.list(requirement.id).then(setApprovals).catch(() => {})
    }
    if (isIS) {
      window.api.systemRemark.list(requirement.id).then(setSystemRemarks).catch(() => {})
    }
  }, [requirement.id, isFT, isIS])

  const reloadRemarks = () => window.api.remark.list(requirement.id).then(setRemarks).catch(() => {})
  const reloadApprovals = () => window.api.approval.list(requirement.id).then(setApprovals).catch(() => {})
  const reloadSystemRemarks = () => window.api.systemRemark.list(requirement.id).then(setSystemRemarks).catch(() => {})

  const parentReq = requirement.parent_id ? requirements.find(r => r.id === requirement.parent_id) : null
  const grandParent = parentReq?.parent_id ? requirements.find(r => r.id === parentReq.parent_id) : null

  if (editing) {
    return (
      <div style={panelStyle}>
        <PanelHeader title="Редактирование" onClose={() => setEditing(false)} />
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <RequirementForm
            initial={requirement}
            requirements={requirements}
            users={users}
            isEdit
            onSave={async (data, changedBy, comment) => {
              await onUpdate(requirement.id, data, changedBy, comment)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      {showHistory && <HistoryPanel requirement={requirement} onClose={() => setShowHistory(false)} />}

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>
                {requirement.req_id}
              </span>
              <Badge value={requirement.type} kind="type" />
              <Badge value={requirement.status} kind="status" />
              {requirement.type !== 'is' && <Badge value={requirement.priority} kind="priority" small />}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.4, margin: 0 }}>
              {requirement.title}
            </h2>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0, padding: 4, marginTop: -2 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <ActionBtn icon={editIcon} label="Изменить" onClick={() => setEditing(true)} />
          <ActionBtn icon={historyIcon} label="История" onClick={() => setShowHistory(true)} />
          <ActionBtn icon={deleteIcon} label="Удалить" onClick={() => setConfirmDelete(true)} danger />
        </div>
      </div>

      {/* Tabs */}
      {(isFT || isIS) && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)', flexShrink: 0 }}>
          {(isFT ? [
            { key: 'info', label: 'Описание' },
            { key: 'remarks', label: `Замечания${remarks.length ? ` (${remarks.length})` : ''}` },
            { key: 'approval', label: `Согласование${approvals.length ? ` (${approvals.length})` : ''}` },
          ] : [
            { key: 'info', label: 'Информация' },
            { key: 'sys_remarks', label: `Замечания${systemRemarks.length ? ` (${systemRemarks.length})` : ''}` },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)}
              style={{
                padding: '9px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: tab === t.key ? 'var(--navy)' : 'var(--gray-500)',
                borderBottom: tab === t.key ? '2px solid var(--navy)' : '2px solid transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {(tab === 'info') && (
          <InfoTab
            requirement={requirement}
            requirements={requirements}
            parentReq={parentReq}
            grandParent={grandParent}
          />
        )}
        {tab === 'remarks' && isFT && (
          <RemarksTab
            ftId={requirement.id}
            remarks={remarks}
            users={users}
            onReload={reloadRemarks}
          />
        )}
        {tab === 'approval' && isFT && (
          <ApprovalTab
            ftId={requirement.id}
            approvals={approvals}
            users={users}
            onReload={async () => {
              await reloadApprovals()
              window.api.req.list().catch(() => {})
            }}
          />
        )}
        {tab === 'sys_remarks' && isIS && (
          <SystemRemarksTab
            isId={requirement.id}
            systemRemarks={systemRemarks}
            requirements={requirements}
            users={users}
            onReload={reloadSystemRemarks}
          />
        )}
      </div>

      {/* Children (non-FT) */}
      {!isFT && tab === 'info' && (
        <ChildrenSection requirement={requirement} requirements={requirements} />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--card-bg)', borderRadius: 12, padding: 28, maxWidth: 380, width: '90%',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Удалить запись?</div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 20 }}>
              «{requirement.title}» будет помечена как удалённая.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)}
                style={{ padding: '8px 18px', border: '1px solid var(--gray-300)', borderRadius: 8, background: 'var(--card-bg)', cursor: 'pointer' }}>
                Отмена
              </button>
              <button onClick={async () => { await onDelete(requirement.id); setConfirmDelete(false) }}
                style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: '#dc2626', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoTab({ requirement, requirements, parentReq, grandParent }: {
  requirement: Requirement
  requirements: Requirement[]
  parentReq: Requirement | null | undefined
  grandParent: Requirement | null | undefined
}) {
  return (
    <div style={{ padding: 20 }}>
      {requirement.description && (
        <Section title="Краткое описание">
          <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
            {requirement.description}
          </p>
        </Section>
      )}
      {requirement.full_description && (
        <Section title="Полное описание">
          <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
            {requirement.full_description}
          </p>
        </Section>
      )}
      {requirement.cenn && (
        <Section title="Ценность / Обоснование">
          <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6, margin: 0 }}>{requirement.cenn}</p>
        </Section>
      )}
      <Section title="Реквизиты">
        <MetaGrid>
          <MetaRow label="Тип" value={TYPE_LONG_LABELS[requirement.type]} />
          {requirement.type === 'is' && <MetaRow label="Функциональный заказчик" value={requirement.author || '—'} />}
          {requirement.type === 'ft' && <MetaRow label="Автор" value={requirement.author || '—'} />}
          <MetaRow label="Создано" value={fmtDate(requirement.created_at)} />
          <MetaRow label="Обновлено" value={fmtDate(requirement.updated_at)} />
          {parentReq && <MetaRow label={requirement.type === 'ft' ? 'БФ' : requirement.type === 'bf' ? 'ИС / МД' : requirement.type === 'mod' ? 'ИС' : 'Родитель'} value={`${parentReq.req_id} — ${parentReq.title}`} />}
          {grandParent && <MetaRow label="ИС" value={`${grandParent.req_id} — ${grandParent.title}`} />}
        </MetaGrid>
      </Section>
    </div>
  )
}

function RemarksTab({ ftId, remarks, users, onReload }: { ftId: number; remarks: Remark[]; users: User[]; onReload: () => void }) {
  const [adding, setAdding] = useState(false)
  const [numRemark, setNumRemark] = useState('')
  const [textRemark, setTextRemark] = useState('')
  const [remarkAuthor, setRemarkAuthor] = useState('')
  const [saving, setSaving] = useState(false)

  const statusColors: Record<string, string> = {
    open: '#dc2626', in_work: '#d97706', closed: '#16a34a',
  }
  const statusLabels: Record<string, string> = {
    open: 'Открыто', in_work: 'В работе', closed: 'Закрыто',
  }

  const handleAdd = async () => {
    if (!textRemark.trim()) return
    setSaving(true)
    try {
      await window.api.remark.create({
        ft_id: ftId, num_remark: numRemark.trim(),
        text_remark: textRemark.trim(), status: 'open', author: remarkAuthor.trim(),
      })
      setNumRemark(''); setTextRemark(''); setRemarkAuthor('')
      setAdding(false)
      onReload()
    } finally { setSaving(false) }
  }

  const handleStatusChange = async (id: number, status: Remark['status']) => {
    await window.api.remark.update(id, { status })
    onReload()
  }

  const handleDelete = async (id: number) => {
    await window.api.remark.delete(id)
    onReload()
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
          Замечания ({remarks.length})
        </span>
        <button onClick={() => setAdding(a => !a)}
          style={{
            padding: '5px 12px', border: '1px solid var(--gray-200)', borderRadius: 6,
            background: adding ? 'var(--gray-100)' : 'var(--card-bg)', fontSize: 12, fontWeight: 600,
            color: 'var(--navy)', cursor: 'pointer',
          }}>
          {adding ? '✕ Отмена' : '+ Добавить'}
        </button>
      </div>

      {adding && (
        <div style={{
          background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
          borderRadius: 8, padding: 14, marginBottom: 14,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Номер замечания">
              <input value={numRemark} onChange={e => setNumRemark(e.target.value)}
                placeholder="ЦПС-123" style={inputSm} />
            </Field>
            <Field label="Автор">
              <UserSelect value={remarkAuthor} onChange={setRemarkAuthor} users={users}
                placeholder="выберите автора" style={inputSm} />
            </Field>
          </div>
          <Field label="Текст замечания *">
            <textarea value={textRemark} onChange={e => setTextRemark(e.target.value)}
              placeholder="Описание замечания..." rows={3}
              style={{ ...inputSm, resize: 'vertical' }} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setAdding(false)}
              style={{ padding: '5px 14px', border: '1px solid var(--gray-300)', borderRadius: 6, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 12 }}>
              Отмена
            </button>
            <button onClick={handleAdd} disabled={saving || !textRemark.trim()}
              style={{
                padding: '5px 14px', border: 'none', borderRadius: 6,
                background: 'var(--navy)', color: 'white', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, opacity: saving ? 0.6 : 1,
              }}>
              {saving ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </div>
      )}

      {remarks.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, padding: '32px 0' }}>
          Замечания отсутствуют
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {remarks.map(r => (
            <div key={r.id} style={{
              border: '1px solid var(--gray-200)', borderRadius: 8, padding: 12,
              borderLeft: `3px solid ${statusColors[r.status] ?? '#64748b'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {r.num_remark && (
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>
                      {r.num_remark}
                    </span>
                  )}
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 99,
                    color: statusColors[r.status], background: (statusColors[r.status] ?? '#64748b') + '15',
                    fontWeight: 600, border: `1px solid ${(statusColors[r.status] ?? '#64748b')}30`,
                  }}>
                    {statusLabels[r.status] ?? r.status}
                  </span>
                  {r.author && <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.author}</span>}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {r.status !== 'closed' && (
                    <button onClick={() => handleStatusChange(r.id, r.status === 'open' ? 'in_work' : 'closed')}
                      style={{
                        padding: '2px 8px', border: '1px solid var(--gray-200)', borderRadius: 4,
                        background: 'var(--card-bg)', cursor: 'pointer', fontSize: 11, color: 'var(--gray-600)',
                      }}>
                      {r.status === 'open' ? 'В работу' : 'Закрыть'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(r.id)}
                    style={{
                      padding: '2px 6px', border: '1px solid #fca5a5', borderRadius: 4,
                      background: '#fff5f5', cursor: 'pointer', fontSize: 11, color: '#dc2626',
                    }}>
                    ✕
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 }}>{r.text_remark}</p>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>
                {fmtDate(r.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ApprovalTab({ ftId, approvals, users, onReload }: { ftId: number; approvals: Approval[]; users: User[]; onReload: () => void }) {
  const [adding, setAdding] = useState(false)
  const [apprStatus, setApprStatus] = useState<Approval['status']>('in_review')
  const [apprComment, setApprComment] = useState('')
  const [apprBy, setApprBy] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editStatus, setEditStatus] = useState<Approval['status']>('in_review')
  const [editComment, setEditComment] = useState('')
  const [editBy, setEditBy] = useState('')

  const statusColors: Record<string, string> = {
    in_review: '#d97706', approved: '#16a34a', rework: '#ea580c', rejected: '#dc2626',
  }
  const statusLabels: Record<string, string> = {
    in_review: 'На согласовании', approved: 'Согласовано', rework: 'На доработке', rejected: 'Отклонено',
  }

  const lastApproval = approvals[0]

  const handleAdd = async () => {
    setSaving(true)
    try {
      await window.api.approval.create({
        ft_id: ftId, status: apprStatus, comment: apprComment.trim(), changed_by: apprBy.trim(),
      })
      setApprComment(''); setApprBy(''); setApprStatus('in_review')
      setAdding(false)
      onReload()
    } finally { setSaving(false) }
  }

  const startEdit = (a: Approval) => {
    setEditingId(a.id); setEditStatus(a.status); setEditComment(a.comment); setEditBy(a.changed_by)
  }

  const handleEditSave = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      await window.api.approval.update(editingId, { status: editStatus, comment: editComment.trim(), changed_by: editBy.trim() })
      setEditingId(null); onReload()
    } finally { setSaving(false) }
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Current status */}
      <div style={{
        background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8,
        padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Текущий статус:</span>
        {lastApproval ? (
          <span style={{
            fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
            color: statusColors[lastApproval.status],
            background: (statusColors[lastApproval.status] ?? '#64748b') + '15',
            border: `1px solid ${(statusColors[lastApproval.status] ?? '#64748b')}30`,
          }}>
            {statusLabels[lastApproval.status] ?? lastApproval.status}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>Черновик</span>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={() => setAdding(a => !a)}
          style={{
            padding: '5px 12px', border: '1px solid var(--gray-200)', borderRadius: 6,
            background: adding ? 'var(--gray-100)' : 'var(--card-bg)', fontSize: 12, fontWeight: 600,
            color: 'var(--navy)', cursor: 'pointer',
          }}>
          {adding ? '✕ Отмена' : '+ Решение'}
        </button>
      </div>

      {adding && (
        <div style={{
          background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
          borderRadius: 8, padding: 14, marginBottom: 14,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <Field label="Решение">
            <select value={apprStatus} onChange={e => setApprStatus(e.target.value as Approval['status'])} style={inputSm}>
              <option value="in_review">На согласовании</option>
              <option value="approved">Согласовано</option>
              <option value="rework">На доработке</option>
              <option value="rejected">Отклонено</option>
            </select>
          </Field>
          <Field label="Кто принял решение">
            <UserSelect value={apprBy} onChange={setApprBy} users={users}
              placeholder="выберите пользователя" style={inputSm} />
          </Field>
          <Field label="Комментарий">
            <textarea value={apprComment} onChange={e => setApprComment(e.target.value)}
              placeholder="Пояснение к решению..." rows={2}
              style={{ ...inputSm, resize: 'vertical' }} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setAdding(false)}
              style={{ padding: '5px 14px', border: '1px solid var(--gray-300)', borderRadius: 6, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 12 }}>
              Отмена
            </button>
            <button onClick={handleAdd} disabled={saving}
              style={{
                padding: '5px 14px', border: 'none', borderRadius: 6,
                background: 'var(--navy)', color: 'white', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, opacity: saving ? 0.6 : 1,
              }}>
              {saving ? '...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
        История согласования
      </div>

      {approvals.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, padding: '24px 0' }}>
          Решений пока нет
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderLeft: '2px solid var(--gray-200)', marginLeft: 8 }}>
          {approvals.map((a, i) => (
            <div key={a.id} style={{ paddingLeft: 16, paddingBottom: 14, position: 'relative' }}>
              <div style={{
                position: 'absolute', left: -5, top: 5,
                width: 8, height: 8, borderRadius: '50%',
                background: i === 0 ? (statusColors[a.status] ?? '#64748b') : 'var(--gray-300)',
                border: '2px solid var(--card-bg)',
              }} />
              {editingId === a.id ? (
                <div style={{
                  background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                  borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Field label="Решение">
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value as Approval['status'])} style={inputSm}>
                        <option value="in_review">На согласовании</option>
                        <option value="approved">Согласовано</option>
                        <option value="rework">На доработке</option>
                        <option value="rejected">Отклонено</option>
                      </select>
                    </Field>
                    <Field label="Кто принял решение">
                      <UserSelect value={editBy} onChange={setEditBy} users={users}
                        placeholder="выберите" style={inputSm} />
                    </Field>
                  </div>
                  <Field label="Комментарий">
                    <textarea value={editComment} onChange={e => setEditComment(e.target.value)}
                      rows={2} style={{ ...inputSm, resize: 'vertical' }} />
                  </Field>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingId(null)}
                      style={{ padding: '4px 12px', border: '1px solid var(--gray-300)', borderRadius: 6, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 12, color: 'var(--gray-700)' }}>
                      Отмена
                    </button>
                    <button onClick={handleEditSave} disabled={saving}
                      style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: 'var(--navy)', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      {saving ? '...' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '1px 7px', borderRadius: 99,
                      color: statusColors[a.status], background: (statusColors[a.status] ?? '#64748b') + '15',
                      border: `1px solid ${(statusColors[a.status] ?? '#64748b')}30`,
                    }}>
                      {statusLabels[a.status] ?? a.status}
                    </span>
                    {a.changed_by && <span style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 500 }}>{a.changed_by}</span>}
                    <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 'auto' }}>{fmtDate(a.changed_at)}</span>
                    <button onClick={() => startEdit(a)} title="Редактировать"
                      style={{ padding: '2px 6px', border: '1px solid var(--gray-200)', borderRadius: 4, background: 'var(--card-bg)', cursor: 'pointer', color: 'var(--gray-500)', display: 'flex', alignItems: 'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                  {a.comment && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {a.comment}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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

function SystemRemarksTab({ isId, systemRemarks, requirements, users, onReload }: {
  isId: number
  systemRemarks: SystemRemark[]
  requirements: Requirement[]
  users: User[]
  onReload: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // МД and БФ belonging to this IS
  const mods = requirements.filter(r => r.type === 'mod' && r.parent_id === isId)
  const modIds = new Set(mods.map(m => m.id))
  const bfs = requirements.filter(r => r.type === 'bf' && r.parent_id !== null && (r.parent_id === isId || modIds.has(r.parent_id)))
  const moduleOptions = [...mods, ...bfs]

  const [form, setForm] = useState<Omit<SystemRemark, 'id' | 'created_at' | 'updated_at'>>({
    is_id: isId, title: '', description: '', module_id: null,
    priority: 'medium', status: 'open', author: '',
  })
  const [saving, setSaving] = useState(false)

  const resetForm = () => setForm({ is_id: isId, title: '', description: '', module_id: null, priority: 'medium', status: 'open', author: '' })

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await window.api.systemRemark.create(form)
      resetForm(); setAdding(false); onReload()
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
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
          Замечания к системе ({systemRemarks.length})
        </span>
        <button onClick={() => { setAdding(a => !a); if (adding) resetForm() }}
          style={{
            padding: '5px 12px', border: '1px solid var(--gray-200)', borderRadius: 6,
            background: adding ? 'var(--gray-100)' : 'var(--card-bg)', fontSize: 12, fontWeight: 600,
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
          onCancel={() => { setAdding(false); resetForm() }}
        />
      )}

      {systemRemarks.length === 0 && !adding ? (
        <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, padding: '32px 0' }}>
          Замечания отсутствуют
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
      borderRadius: 8, padding: 14, marginBottom: 14,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <Field label="Заголовок *">
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Краткое описание замечания" style={inputSm} autoFocus />
      </Field>
      <Field label="Описание">
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Подробное описание..." rows={3} style={{ ...inputSm, resize: 'vertical' }} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
          style={{ padding: '5px 14px', border: '1px solid var(--gray-300)', borderRadius: 6, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 12 }}>
          Отмена
        </button>
        <button onClick={onSave} disabled={saving || !form.title.trim()}
          style={{
            padding: '5px 14px', border: 'none', borderRadius: 6,
            background: 'var(--navy)', color: 'white', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, opacity: saving || !form.title.trim() ? 0.6 : 1,
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
        border: '1px solid var(--gray-200)', borderRadius: 8, padding: 12,
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
            style={{ padding: '4px 12px', border: '1px solid var(--gray-300)', borderRadius: 6, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 12, color: 'var(--gray-700)' }}>
            Отмена
          </button>
          <button onClick={() => onSaveEdit(editForm)} disabled={!editForm.title?.trim()}
            style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: 'var(--navy)', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            Сохранить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      border: '1px solid var(--gray-200)', borderRadius: 8, padding: 12,
      borderLeft: `3px solid ${SYS_STATUS_COLORS[remark.status] ?? '#64748b'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <span style={{
            fontSize: 11, padding: '1px 6px', borderRadius: 99, fontWeight: 600,
            color: SYS_STATUS_COLORS[remark.status], background: (SYS_STATUS_COLORS[remark.status] ?? '#64748b') + '15',
            border: `1px solid ${(SYS_STATUS_COLORS[remark.status] ?? '#64748b')}30`,
          }}>
            {SYS_STATUS_LABELS[remark.status] ?? remark.status}
          </span>
          <span style={{
            fontSize: 11, padding: '1px 6px', borderRadius: 99, fontWeight: 600,
            color: PRIORITY_COLORS[remark.priority], background: (PRIORITY_COLORS[remark.priority] ?? '#64748b') + '15',
            border: `1px solid ${(PRIORITY_COLORS[remark.priority] ?? '#64748b')}30`,
          }}>
            {PRIORITY_LABELS_RU[remark.priority] ?? remark.priority}
          </span>
          {remark.author && <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{remark.author}</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={onEdit} title="Редактировать"
            style={{ padding: '2px 6px', border: '1px solid var(--gray-200)', borderRadius: 4, background: 'var(--card-bg)', cursor: 'pointer', color: 'var(--gray-500)', display: 'flex', alignItems: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={onDelete} title="Удалить"
            style={{ padding: '2px 6px', border: '1px solid #fca5a5', borderRadius: 4, background: '#fff5f5', cursor: 'pointer', fontSize: 11, color: '#dc2626' }}>
            ✕
          </button>
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)', marginBottom: 4 }}>{remark.title}</div>
      {modLabel && (
        <div style={{ fontSize: 11, color: 'var(--navy)', marginBottom: 4, fontWeight: 500 }}>
          {modLabel}
        </div>
      )}
      {remark.description && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>{remark.description}</p>
      )}
      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>{fmtDate(remark.created_at)}</div>
    </div>
  )
}

function ChildrenSection({ requirement, requirements }: { requirement: Requirement; requirements: Requirement[] }) {
  const children = requirements.filter(r => r.parent_id === requirement.id)
  if (children.length === 0) return null
  const label = requirement.type === 'is' ? 'Модули и блоки' : requirement.type === 'mod' ? 'Функциональные блоки (БФ)' : 'Требования (ФТ)'

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <Section title={label}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {children.map(child => (
            <div key={child.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
              border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 13,
            }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--gray-500)', flexShrink: 0, fontSize: 12 }}>{child.req_id}</span>
              <span style={{ flex: 1, color: 'var(--gray-700)' }}>{child.title}</span>
              <Badge value={child.status} kind="status" small />
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function MetaGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{children}</div>
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, fontSize: 13 }}>
      <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--gray-700)' }}>{value}</span>
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

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
      <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
      border: `1px solid ${danger ? '#fca5a5' : 'var(--gray-200)'}`,
      borderRadius: 6, background: danger ? '#fff5f5' : 'var(--card-bg)',
      color: danger ? '#dc2626' : 'var(--gray-600)',
      fontSize: 12, fontWeight: 500, cursor: 'pointer',
    }}>
      {icon} {label}
    </button>
  )
}

const panelStyle: React.CSSProperties = {
  width: 440, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)',
  borderLeft: '1px solid var(--gray-200)', height: '100%', overflow: 'hidden', position: 'relative',
}

const inputSm: React.CSSProperties = {
  width: '100%', padding: '6px 10px',
  border: '1px solid var(--gray-200)', borderRadius: 6,
  fontSize: 13, outline: 'none', color: 'var(--gray-800)',
}

const editIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const historyIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
)
const deleteIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
)

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
