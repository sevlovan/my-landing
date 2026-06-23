import React, { useState } from 'react'
import { Contract, Requirement, TYPE_COLORS } from '../types'

const TYPE_WORK_OPTIONS = ['Проработка', 'Создание', 'Развитие', 'Тиражирование', 'Интеграции', 'Концепция']
const IST_FIN_OPTIONS = ['', 'Инвестпрограмма', 'ИАУ', 'ГЭ', 'Бюджет Д651', 'Договор ТП']
const STATUS_OPTIONS = ['', 'проект не инициирован', 'в работе', 'сформирован', 'утвержден']

const STATUS_COLORS: Record<string, string> = {
  'проект не инициирован': '#64748b',
  'в работе': '#d97706',
  'сформирован': '#2563eb',
  'утвержден': '#16a34a',
}

interface ContractsTabProps {
  isId: number
  contracts: Contract[]
  requirements: Requirement[]
  onReload: () => void
}

const emptyForm = (): Omit<Contract, 'id' | 'created_at' | 'updated_at'> => ({
  is_id: 0,
  tz: '',
  n_izm: null,
  date_utv: null,
  prich_vn_izm: '',
  noch: null,
  net: null,
  name_et: '',
  type_work: '',
  ist_fin: '',
  cost: null,
  komm: '',
  status_form_vr: '',
})

export function ContractsTab({ isId, contracts, requirements, onReload }: ContractsTabProps) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const openAdd = () => {
    setForm({ ...emptyForm(), is_id: isId })
    setEditingId(null)
    setAdding(true)
  }

  const openEdit = (c: Contract) => {
    setForm({
      is_id: c.is_id, tz: c.tz, n_izm: c.n_izm, date_utv: c.date_utv,
      prich_vn_izm: c.prich_vn_izm, noch: c.noch, net: c.net, name_et: c.name_et,
      type_work: c.type_work, ist_fin: c.ist_fin, cost: c.cost,
      komm: c.komm, status_form_vr: c.status_form_vr,
    })
    setEditingId(c.id)
    setAdding(true)
  }

  const handleTypeWorkToggle = (val: string) => {
    const current = form.type_work ? form.type_work.split(',') : []
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
    setForm(f => ({ ...f, type_work: next.join(',') }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingId !== null) {
        const { is_id: _omit, ...data } = form
        await window.api.contract.update(editingId, data)
      } else {
        await window.api.contract.create(form)
      }
      setAdding(false)
      setEditingId(null)
      onReload()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    await window.api.contract.delete(id)
    setConfirmDelete(null)
    onReload()
  }

  const selectedTypeWork = form.type_work ? form.type_work.split(',') : []

  return (
    <div style={{ padding: '20px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>
          Договоры ({contracts.length})
        </span>
        <button onClick={openAdd}
          style={{
            padding: '6px 16px', border: 'none', borderRadius: 7,
            background: 'var(--navy)', color: 'white', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}>
          + Добавить
        </button>
      </div>

      {/* Form */}
      {adding && (
        <div style={{
          background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
          borderRadius: 10, padding: 20, marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)', marginBottom: 2 }}>
            {editingId !== null ? 'Редактирование' : 'Новый договор'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormField label="ТЗ / тип документа">
              <input value={form.tz} onChange={e => setForm(f => ({ ...f, tz: e.target.value }))}
                placeholder="ТЗ / Изм. / ЗНИ / Протокол ПДК" style={inputStyle} />
            </FormField>
            <FormField label="Номер изм.">
              <input type="number" value={form.n_izm ?? ''} onChange={e => setForm(f => ({ ...f, n_izm: e.target.value ? Number(e.target.value) : null }))}
                style={inputStyle} />
            </FormField>
            <FormField label="Дата утверждения">
              <input type="date" value={form.date_utv ?? ''} onChange={e => setForm(f => ({ ...f, date_utv: e.target.value || null }))}
                style={inputStyle} />
            </FormField>
          </div>

          <FormField label="Причина внесения изменений">
            <input value={form.prich_vn_izm} onChange={e => setForm(f => ({ ...f, prich_vn_izm: e.target.value }))}
              style={inputStyle} />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormField label="Номер очереди">
              <input type="number" value={form.noch ?? ''} onChange={e => setForm(f => ({ ...f, noch: e.target.value ? Number(e.target.value) : null }))}
                style={inputStyle} />
            </FormField>
            <FormField label="Номер этапа">
              <input type="number" value={form.net ?? ''} onChange={e => setForm(f => ({ ...f, net: e.target.value ? Number(e.target.value) : null }))}
                style={inputStyle} />
            </FormField>
            <FormField label="Наименование этапа">
              <input value={form.name_et} onChange={e => setForm(f => ({ ...f, name_et: e.target.value }))}
                style={inputStyle} />
            </FormField>
          </div>

          <FormField label="Вид работ">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
              {TYPE_WORK_OPTIONS.map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer', color: 'var(--gray-700)' }}>
                  <input type="checkbox" checked={selectedTypeWork.includes(opt)}
                    onChange={() => handleTypeWorkToggle(opt)} style={{ cursor: 'pointer' }} />
                  {opt}
                </label>
              ))}
            </div>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormField label="Источник финансирования">
              <select value={form.ist_fin} onChange={e => setForm(f => ({ ...f, ist_fin: e.target.value }))} style={inputStyle}>
                {IST_FIN_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
              </select>
            </FormField>
            <FormField label="Стоимость">
              <input type="number" value={form.cost ?? ''} onChange={e => setForm(f => ({ ...f, cost: e.target.value ? Number(e.target.value) : null }))}
                style={inputStyle} />
            </FormField>
            <FormField label="Статус формирования ОР">
              <select value={form.status_form_vr} onChange={e => setForm(f => ({ ...f, status_form_vr: e.target.value }))} style={inputStyle}>
                {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Комментарий">
            <textarea value={form.komm} onChange={e => setForm(f => ({ ...f, komm: e.target.value }))}
              rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => { setAdding(false); setEditingId(null) }}
              style={{ padding: '6px 16px', border: '1px solid var(--gray-300)', borderRadius: 7, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 13 }}>
              Отмена
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '6px 16px', border: 'none', borderRadius: 7, background: 'var(--navy)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {contracts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, padding: '48px 0' }}>
          Договоры не добавлены
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contracts.map(c => {
            const statusColor = STATUS_COLORS[c.status_form_vr] ?? '#64748b'
            const typeWorkList = c.type_work ? c.type_work.split(',') : []
            const linkedFTs = requirements.filter(r => r.type === 'ft' && r.contract_id === c.id)
            return (
              <div key={c.id} style={{
                border: '1px solid var(--gray-200)', borderRadius: 10,
                padding: '14px 16px', background: 'var(--card-bg)',
                borderLeft: `4px solid ${statusColor}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    {c.tz && <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-800)' }}>{c.tz}</span>}
                    {c.n_izm !== null && <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Изм. №{c.n_izm}</span>}
                    {c.status_form_vr && (
                      <span style={{
                        fontSize: 11, padding: '1px 8px', borderRadius: 99, fontWeight: 600,
                        color: statusColor, background: statusColor + '18', border: `1px solid ${statusColor}35`,
                      }}>
                        {c.status_form_vr}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openEdit(c)}
                      style={{ padding: '3px 10px', border: '1px solid var(--gray-200)', borderRadius: 5, background: 'var(--card-bg)', cursor: 'pointer', fontSize: 12, color: 'var(--gray-600)' }}>
                      Изменить
                    </button>
                    <button onClick={() => setConfirmDelete(c.id)}
                      style={{ padding: '3px 8px', border: '1px solid #fca5a5', borderRadius: 5, background: '#fff5f5', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>
                      ✕
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '4px 16px', fontSize: 12 }}>
                  {c.date_utv && <MetaRow label="Дата утв." value={fmtDate(c.date_utv)} />}
                  {c.noch !== null && <MetaRow label="Очередь" value={String(c.noch)} />}
                  {c.net !== null && <MetaRow label="Этап" value={String(c.net)} />}
                  {c.name_et && <MetaRow label="Наим. этапа" value={c.name_et} />}
                  {c.ist_fin && <MetaRow label="Ист. финансирования" value={c.ist_fin} />}
                  {c.cost !== null && <MetaRow label="Стоимость" value={c.cost.toLocaleString('ru-RU')} />}
                  {c.prich_vn_izm && <MetaRow label="Причина изм." value={c.prich_vn_izm} />}
                </div>

                {typeWorkList.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {typeWorkList.map(tw => (
                      <span key={tw} style={{ fontSize: 11, padding: '1px 8px', borderRadius: 99, background: 'var(--gray-100)', color: 'var(--gray-600)', border: '1px solid var(--gray-200)' }}>
                        {tw}
                      </span>
                    ))}
                  </div>
                )}

                {c.komm && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-500)', fontStyle: 'italic' }}>{c.komm}</div>
                )}

                {linkedFTs.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                      Функциональные требования ({linkedFTs.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {linkedFTs.map(ft => (
                        <div key={ft.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <span style={{ fontFamily: 'monospace', color: TYPE_COLORS.ft, fontWeight: 700, flexShrink: 0 }}>{ft.req_id}</span>
                          <span style={{ color: 'var(--gray-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ft.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 28, maxWidth: 360, width: '90%', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Удалить договор?</div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 20 }}>Запись будет удалена без возможности восстановления.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding: '8px 18px', border: '1px solid var(--gray-300)', borderRadius: 8, background: 'var(--card-bg)', cursor: 'pointer' }}>
                Отмена
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <span style={{ color: 'var(--gray-400)', flexShrink: 0 }}>{label}:</span>
      <span style={{ color: 'var(--gray-700)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 10px',
  border: '1px solid var(--gray-200)', borderRadius: 6,
  fontSize: 13, outline: 'none', color: 'var(--gray-800)',
  background: 'var(--card-bg)', boxSizing: 'border-box',
}

function fmtDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
