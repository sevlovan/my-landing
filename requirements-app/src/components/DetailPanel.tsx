import React, { useState } from 'react'
import { Requirement } from '../types'
import { Badge } from './Badge'
import { RequirementForm } from './RequirementForm'
import { HistoryPanel } from './HistoryPanel'

interface DetailPanelProps {
  requirement: Requirement
  requirements: Requirement[]
  onUpdate: (id: number, data: Partial<Requirement>, changedBy: string, comment: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onClose: () => void
}

export function DetailPanel({ requirement, requirements, onUpdate, onDelete, onClose }: DetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const parentReq = requirement.parent_id ? requirements.find(r => r.id === requirement.parent_id) : null

  if (editing) {
    return (
      <div style={panelStyle}>
        <PanelHeader title="Редактировать требование" onClose={() => setEditing(false)} />
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          <RequirementForm
            initial={requirement}
            requirements={requirements}
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
      <div style={{
        padding: '18px 20px', borderBottom: '1px solid var(--gray-100)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>
                {requirement.req_id}
              </span>
              <Badge value={requirement.type} kind="type" />
              <Badge value={requirement.priority} kind="priority" />
              <Badge value={requirement.status} kind="status" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.3 }}>
              {requirement.title}
            </h2>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0, padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionBtn icon={editIcon} label="Редактировать" onClick={() => setEditing(true)} />
          <ActionBtn icon={historyIcon} label="История" onClick={() => setShowHistory(true)} />
          <ActionBtn icon={deleteIcon} label="Удалить" onClick={() => setConfirmDelete(true)} danger />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Description */}
        {requirement.description && (
          <Section title="Описание">
            <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {requirement.description}
            </p>
          </Section>
        )}

        {/* Meta */}
        <Section title="Детали">
          <MetaGrid>
            <MetaRow label="Автор" value={requirement.author} />
            <MetaRow label="Создано" value={formatDate(requirement.created_at)} />
            <MetaRow label="Обновлено" value={formatDate(requirement.updated_at)} />
            {parentReq && (
              <MetaRow label={requirement.type === 'story' ? 'Фича' : 'Эпик'}
                value={`${parentReq.req_id} — ${parentReq.title}`} />
            )}
          </MetaGrid>
        </Section>

        {/* Child requirements */}
        <ChildrenSection requirement={requirement} requirements={requirements} />
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 12, padding: 28, maxWidth: 380, width: '90%',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Удалить требование?</div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 20 }}>
              «{requirement.title}» будет помечено как удалённое. Это действие нельзя отменить.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)}
                style={{ padding: '8px 18px', border: '1px solid var(--gray-300)', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function MetaGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, fontSize: 13 }}>
      <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--gray-700)' }}>{value}</span>
    </div>
  )
}

function ChildrenSection({ requirement, requirements }: { requirement: Requirement; requirements: Requirement[] }) {
  const children = requirements.filter(r => r.parent_id === requirement.id)
  if (children.length === 0) return null

  return (
    <Section title={requirement.type === 'epic' ? 'Фичи' : 'Истории'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children.map(child => (
          <div key={child.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 13,
          }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--gray-500)', flexShrink: 0 }}>{child.req_id}</span>
            <span style={{ flex: 1, color: 'var(--gray-700)' }}>{child.title}</span>
            <Badge value={child.status} kind="status" small />
          </div>
        ))}
      </div>
    </Section>
  )
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{
      padding: '18px 20px', borderBottom: '1px solid var(--gray-100)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
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
      borderRadius: 6, background: danger ? '#fff5f5' : 'white',
      color: danger ? '#dc2626' : 'var(--gray-600)',
      fontSize: 12, fontWeight: 500, cursor: 'pointer',
      transition: 'all 0.15s',
    }}>
      {icon} {label}
    </button>
  )
}

const panelStyle: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', background: 'white',
  borderLeft: '1px solid var(--gray-200)', height: '100vh', overflow: 'hidden', position: 'relative',
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
