import React, { useState } from 'react'
import { Requirement, RequirementType, Priority, Status } from '../types'
import { Badge } from './Badge'

interface TableViewProps {
  requirements: Requirement[]
  selectedId: number | null
  onSelect: (req: Requirement) => void
}

type SortKey = 'req_id' | 'title' | 'type' | 'priority' | 'status' | 'author' | 'created_at'

const typeOrder: Record<RequirementType, number> = { epic: 0, feature: 1, story: 2 }
const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
const statusOrder: Record<Status, number> = { draft: 0, in_review: 1, approved: 2, rejected: 3 }

export function TableView({ requirements, selectedId, onSelect }: TableViewProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'req_id', dir: 1 })
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const filtered = requirements.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sort.key === 'type') cmp = typeOrder[a.type] - typeOrder[b.type]
    else if (sort.key === 'priority') cmp = priorityOrder[a.priority] - priorityOrder[b.priority]
    else if (sort.key === 'status') cmp = statusOrder[a.status as Status] - statusOrder[b.status as Status]
    else cmp = String(a[sort.key]).localeCompare(String(b[sort.key]), 'ru')
    return cmp * sort.dir
  })

  const toggleSort = (key: SortKey) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filters */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid var(--gray-100)',
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'var(--gray-50)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)' }}>Фильтры:</span>
        <FilterSelect label="Тип" value={filterType} onChange={setFilterType}
          options={[['all', 'Все типы'], ['epic', 'Эпик'], ['feature', 'Фича'], ['story', 'История']]} />
        <FilterSelect label="Статус" value={filterStatus} onChange={setFilterStatus}
          options={[['all', 'Все статусы'], ['draft', 'Черновик'], ['in_review', 'На проверке'], ['approved', 'Утверждено'], ['rejected', 'Отклонено']]} />
        <FilterSelect label="Приоритет" value={filterPriority} onChange={setFilterPriority}
          options={[['all', 'Все'], ['high', 'Высокий'], ['medium', 'Средний'], ['low', 'Низкий']]} />
        <span style={{ fontSize: 12, color: 'var(--gray-400)', marginLeft: 'auto' }}>{sorted.length} из {requirements.length}</span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              {([ ['req_id', 'ID', 80], ['title', 'Название', 280], ['type', 'Тип', 90], ['priority', 'Приоритет', 100], ['status', 'Статус', 110], ['author', 'Автор', 120], ['created_at', 'Создано', 110] ] as [SortKey, string, number][]).map(([key, label, width]) => (
                <th key={key} onClick={() => toggleSort(key)}
                  style={{
                    padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-600)',
                    cursor: 'pointer', userSelect: 'none', width, whiteSpace: 'nowrap',
                    position: 'sticky', top: 0, background: 'var(--gray-50)',
                  }}>
                  {label}
                  {sort.key === key && <span style={{ marginLeft: 4 }}>{sort.dir === 1 ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((req, i) => (
              <tr key={req.id} onClick={() => onSelect(req)}
                style={{
                  cursor: 'pointer',
                  background: selectedId === req.id ? 'var(--blue-light)' : i % 2 === 0 ? 'white' : 'var(--gray-50)',
                  borderBottom: '1px solid var(--gray-100)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (selectedId !== req.id) e.currentTarget.style.background = '#f0f4fe' }}
                onMouseLeave={e => { e.currentTarget.style.background = selectedId === req.id ? 'var(--blue-light)' : i % 2 === 0 ? 'white' : 'var(--gray-50)' }}
              >
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--gray-500)', fontWeight: 500 }}>{req.req_id}</td>
                <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--gray-800)', maxWidth: 280 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</div>
                  {req.description && (
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {req.description}
                    </div>
                  )}
                </td>
                <td style={{ padding: '8px 12px' }}><Badge value={req.type} kind="type" small /></td>
                <td style={{ padding: '8px 12px' }}><Badge value={req.priority} kind="priority" small /></td>
                <td style={{ padding: '8px 12px' }}><Badge value={req.status} kind="status" small /></td>
                <td style={{ padding: '8px 12px', color: 'var(--gray-600)' }}>{req.author}</td>
                <td style={{ padding: '8px 12px', color: 'var(--gray-400)' }}>{req.created_at.slice(0, 10)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                  Нет требований, соответствующих фильтрам
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        padding: '4px 10px', border: '1px solid var(--gray-200)', borderRadius: 6,
        fontSize: 12, color: 'var(--gray-700)', background: 'white', cursor: 'pointer',
      }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}
