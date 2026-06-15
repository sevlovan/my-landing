import React, { useEffect, useState } from 'react'
import { Requirement, RequirementType, Priority, Status, TYPE_LONG_LABELS } from '../types'

interface RequirementFormProps {
  initial?: Partial<Requirement>
  defaultType?: RequirementType
  defaultParentId?: number
  requirements: Requirement[]
  onSave: (data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>, changedBy: string, comment: string) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

export function RequirementForm({
  initial, defaultType, defaultParentId, requirements, onSave, onCancel, isEdit,
}: RequirementFormProps) {
  const [type, setType] = useState<RequirementType>(initial?.type ?? defaultType ?? 'is')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [fullDescription, setFullDescription] = useState(initial?.full_description ?? '')
  const [cenn, setCenn] = useState(initial?.cenn ?? '')
  const [parentId, setParentId] = useState<number | null>(initial?.parent_id ?? defaultParentId ?? null)
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [status, setStatus] = useState<Status>(initial?.status ?? 'draft')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [changedBy, setChangedBy] = useState('')
  const [comment, setComment] = useState('')
  const [reqId, setReqId] = useState(initial?.req_id ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isEdit && !reqId) {
      window.api.req.generateId(type, parentId).then(setReqId).catch(() => {})
    }
  }, [type, parentId, isEdit, reqId])

  useEffect(() => {
    if (!isEdit) {
      setReqId('')
    }
  }, [type, isEdit])

  const parentOptions = requirements.filter(r => {
    if (type === 'mod') return r.type === 'is'
    if (type === 'bf') return r.type === 'is' || r.type === 'mod'
    if (type === 'ft') return r.type === 'bf'
    return false
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Обязательное поле'
    if (isEdit && !changedBy.trim()) e.changedBy = 'Укажите, кто вносит изменения'
    if ((type === 'mod' || type === 'bf' || type === 'ft') && !parentId) e.parentId = 'Выберите родительский элемент'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      await onSave(
        {
          req_id: reqId,
          title: title.trim(),
          description: description.trim(),
          full_description: fullDescription.trim(),
          cenn: cenn.trim(),
          type,
          parent_id: parentId,
          priority,
          status,
          author: author.trim(),
        },
        changedBy.trim() || author.trim() || 'пользователь',
        comment.trim()
      )
    } finally {
      setSaving(false)
    }
  }

  const isFT = type === 'ft'
  const isIS = type === 'is'
  const showAuthor = isFT || isIS
  const needsParent = type === 'mod' || type === 'bf' || type === 'ft'

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FieldGroup label="Тип" error={undefined}>
          <select value={type} onChange={e => { if (!isEdit) setType(e.target.value as RequirementType) }}
            disabled={isEdit}
            style={{ ...inputStyle, background: isEdit ? 'var(--gray-100)' : 'var(--card-bg)' }}>
            <option value="is">ИС — Информационная система</option>
            <option value="mod">МД — Модуль</option>
            <option value="bf">БФ — Функциональный блок</option>
            <option value="ft">ФТ — Функциональное требование</option>
          </select>
        </FieldGroup>

        <FieldGroup label="ID" error={undefined}>
          <input value={reqId} onChange={e => setReqId(e.target.value)}
            readOnly={isEdit}
            placeholder="Генерируется автоматически"
            style={{ ...inputStyle, background: isEdit ? 'var(--gray-100)' : 'var(--card-bg)', fontFamily: 'monospace' }} />
        </FieldGroup>
      </div>

      <FieldGroup label="Название *" error={errors.title}>
        <input value={title} onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })) }}
          placeholder={`Название ${TYPE_LONG_LABELS[type]}`}
          style={inputStyle} autoFocus />
      </FieldGroup>

      <FieldGroup label="Краткое описание" error={undefined}>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Краткое описание..."
          rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
      </FieldGroup>

      {isFT && (
        <FieldGroup label="Полное описание" error={undefined}>
          <textarea value={fullDescription} onChange={e => setFullDescription(e.target.value)}
            placeholder="Подробное описание функционального требования, критерии приёмки..."
            rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </FieldGroup>
      )}

      {isFT && (
        <FieldGroup label="Ценность / Обоснование" error={undefined}>
          <textarea value={cenn} onChange={e => setCenn(e.target.value)}
            placeholder="Ценность для бизнеса, обоснование необходимости..."
            rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </FieldGroup>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isFT ? '1fr 1fr 1fr' : showAuthor ? '1fr 1fr' : '1fr', gap: 12 }}>
        {isFT && (
          <FieldGroup label="Приоритет" error={undefined}>
            <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={inputStyle}>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </FieldGroup>
        )}

        <FieldGroup label="Статус" error={undefined}>
          <select value={status} onChange={e => setStatus(e.target.value as Status)} style={inputStyle}>
            <option value="draft">Черновик</option>
            <option value="in_review">На согласовании</option>
            <option value="approved">Согласовано</option>
            <option value="rework">На доработке</option>
            <option value="rejected">Отклонено</option>
          </select>
        </FieldGroup>

        {showAuthor && (
          <FieldGroup label={isIS ? 'Функциональный заказчик' : 'Автор'} error={errors.author}>
            <input value={author} onChange={e => { setAuthor(e.target.value); setErrors(p => ({ ...p, author: '' })) }}
              placeholder={isIS ? 'ФИО заказчика' : 'ФИО автора'} style={inputStyle} />
          </FieldGroup>
        )}
      </div>

      {needsParent && (
        <FieldGroup
          label={type === 'mod' ? 'Информационная система (ИС) *' : type === 'bf' ? 'Система или Модуль (ИС / МД) *' : 'Функциональный блок (БФ) *'}
          error={errors.parentId}
        >
          <select
            value={parentId ?? ''}
            onChange={e => { setParentId(Number(e.target.value) || null); setErrors(p => ({ ...p, parentId: '' })) }}
            style={inputStyle}
          >
            <option value="">— выберите —</option>
            {parentOptions.map(p => (
              <option key={p.id} value={p.id}>{p.req_id} — {p.title}</option>
            ))}
          </select>
        </FieldGroup>
      )}

      {isEdit && (
        <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 14, border: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 10 }}>Информация об изменении</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <FieldGroup label="Кто изменяет *" error={errors.changedBy}>
              <input value={changedBy} onChange={e => { setChangedBy(e.target.value); setErrors(p => ({ ...p, changedBy: '' })) }}
                placeholder="ФИО" style={inputStyle} />
            </FieldGroup>
            <FieldGroup label="Причина изменения" error={undefined}>
              <input value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Что и почему изменено..." style={inputStyle} />
            </FieldGroup>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '8px 20px', border: '1px solid var(--gray-300)', borderRadius: 8, background: 'var(--card-bg)', fontWeight: 500, cursor: 'pointer' }}>
          Отмена
        </button>
        <button type="submit" disabled={saving}
          style={{
            padding: '8px 24px', border: 'none', borderRadius: 8,
            background: saving ? 'var(--gray-400)' : 'var(--navy)', color: 'white',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
          {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid var(--gray-200)', borderRadius: 8,
  fontSize: 14, outline: 'none', color: 'var(--gray-800)',
}

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>}
    </div>
  )
}
