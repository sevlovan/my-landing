import React, { useState, useEffect } from 'react'
import { Requirement, Remark, Approval, Contract, STATUS_LABELS, STATUS_COLORS, IS_PHASE_COLORS, TYPE_LONG_LABELS, User } from '../types'
import { Badge } from './Badge'
import { RequirementForm } from './RequirementForm'
import { HistoryPanel } from './HistoryPanel'
import { UserSelect } from './UserSelect'

interface DetailPanelProps {
  requirement: Requirement
  requirements: Requirement[]
  users?: User[]
  contracts?: Contract[]
  width?: number
  onUpdate: (id: number, data: Partial<Requirement>, changedBy: string, comment: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onClose: () => void
}

type Tab = 'info' | 'remarks' | 'approval'

export function DetailPanel({ requirement, requirements, users = [], contracts = [], width, onUpdate, onDelete, onClose }: DetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState<Tab>('info')

  const [remarks, setRemarks] = useState<Remark[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])

  const isFT = requirement.type === 'ft'

  useEffect(() => {
    setEditing(false)
    setTab('info')
    if (isFT) {
      window.api.remark.list(requirement.id).then(setRemarks).catch(() => {})
      window.api.approval.list(requirement.id).then(setApprovals).catch(() => {})
    }
  }, [requirement.id, isFT])

  const reloadRemarks = () => window.api.remark.list(requirement.id).then(setRemarks).catch(() => {})
  const reloadApprovals = () => window.api.approval.list(requirement.id).then(setApprovals).catch(() => {})

  const handleContractChange = async (contractId: number | null) => {
    await onUpdate(requirement.id, { contract_id: contractId }, 'система', '')
  }

  const parentReq = requirement.parent_id ? requirements.find(r => r.id === requirement.parent_id) : null
  const grandParent = parentReq?.parent_id ? requirements.find(r => r.id === parentReq.parent_id) : null

  if (editing) {
    return (
      <div style={panelStyle(width)}>
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
    <div style={panelStyle(width)}>
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
              {requirement.type === 'is' ? (
                requirement.is_phase ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    color: IS_PHASE_COLORS[requirement.is_phase] ?? '#64748b',
                    background: (IS_PHASE_COLORS[requirement.is_phase] ?? '#64748b') + '18',
                    border: `1px solid ${(IS_PHASE_COLORS[requirement.is_phase] ?? '#64748b')}30`,
                  }}>
                    {requirement.is_phase}
                  </span>
                ) : null
              ) : (
                <Badge value={requirement.status} kind="status" />
              )}
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

      {/* Tabs (only for FT) */}
      {isFT && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)', flexShrink: 0 }}>
          {([
            { key: 'info', label: 'Описание' },
            { key: 'remarks', label: `Замечания${remarks.length ? ` (${remarks.length})` : ''}` },
            { key: 'approval', label: `Согласование${approvals.length ? ` (${approvals.length})` : ''}` },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
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
        {tab === 'info' && (
          <InfoTab
            requirement={requirement}
            requirements={requirements}
            parentReq={parentReq}
            grandParent={grandParent}
            contracts={contracts}
            onContractChange={handleContractChange}
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
      </div>

      {/* Children (mod/bf only — IS info is on the ФА tab) */}
      {!isFT && requirement.type !== 'is' && tab === 'info' && (
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

function InfoTab({ requirement, requirements, parentReq, grandParent, contracts, onContractChange }: {
  requirement: Requirement
  requirements: Requirement[]
  parentReq: Requirement | null | undefined
  grandParent: Requirement | null | undefined
  contracts?: Contract[]
  onContractChange?: (id: number | null) => void
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
          {requirement.type === 'is' && requirement.is_phase && <MetaRow label="Статус" value={requirement.is_phase} />}
          {requirement.type === 'is' && requirement.vendor && <MetaRow label="Вендор" value={requirement.vendor} />}
          {requirement.type === 'is' && requirement.product && <MetaRow label="Продукт" value={requirement.product} />}
          {requirement.type === 'ft' && <MetaRow label="Автор" value={requirement.author || '—'} />}
          <MetaRow label="Создано" value={fmtDate(requirement.created_at)} />
          <MetaRow label="Обновлено" value={fmtDate(requirement.updated_at)} />
          {parentReq && <MetaRow label={requirement.type === 'ft' ? 'БФ' : requirement.type === 'bf' ? 'ИС / МД' : requirement.type === 'mod' ? 'ИС' : 'Родитель'} value={`${parentReq.req_id} — ${parentReq.title}`} />}
          {grandParent && <MetaRow label="ИС" value={`${grandParent.req_id} — ${grandParent.title}`} />}
        </MetaGrid>
      </Section>
      {requirement.type === 'ft' && contracts && onContractChange && (
        <Section title="Договор">
          <select
            value={requirement.contract_id ?? ''}
            onChange={e => onContractChange(e.target.value ? Number(e.target.value) : null)}
            style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--gray-200)', borderRadius: 7, fontSize: 13, outline: 'none', color: 'var(--gray-800)', background: 'var(--card-bg)' }}
          >
            <option value="">— не привязан —</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>
                {c.tz || `Договор #${c.id}`}{c.name_et ? ` — ${c.name_et}` : ''}
              </option>
            ))}
          </select>
        </Section>
      )}
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

const panelStyle = (width?: number): React.CSSProperties => ({
  width: width ?? 440, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)',
  height: '100%', overflow: 'hidden', position: 'relative',
})

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
