import React, { useState } from 'react'
import { Requirement } from '../types'

interface ToolbarProps {
  requirements: Requirement[]
  view: 'tree' | 'table'
  onViewChange: (v: 'tree' | 'table') => void
}

export function Toolbar({ requirements, view, onViewChange }: ToolbarProps) {
  const [exporting, setExporting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const doExport = async (format: 'excel' | 'word' | 'pdf') => {
    setExporting(format)
    try {
      const result = await window.api.export[format](requirements)
      if (result.ok) showToast(`Файл сохранён: ${result.filePath}`)
    } catch (e) {
      showToast('Ошибка экспорта')
    } finally {
      setExporting(null)
    }
  }

  const total = requirements.length
  const byType = {
    epic: requirements.filter(r => r.type === 'epic').length,
    feature: requirements.filter(r => r.type === 'feature').length,
    story: requirements.filter(r => r.type === 'story').length,
  }

  return (
    <div style={{
      height: 52, borderBottom: '1px solid var(--gray-200)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', background: 'white', flexShrink: 0,
    }}>
      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--gray-600)' }}>
        <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{total} требований</span>
        <span style={{ color: 'var(--gray-300)' }}>|</span>
        <span>{byType.epic} эп</span>
        <span>{byType.feature} фич</span>
        <span>{byType.story} ист</span>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* View toggle */}
        <div style={{
          display: 'flex', border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden',
        }}>
          {(['tree', 'table'] as const).map(v => (
            <button key={v} onClick={() => onViewChange(v)}
              style={{
                padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: view === v ? 'var(--navy)' : 'white',
                color: view === v ? 'white' : 'var(--gray-600)',
              }}>
              {v === 'tree' ? 'Дерево' : 'Таблица'}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--gray-200)' }} />

        {/* Export */}
        <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>Экспорт:</span>
        {(['excel', 'word', 'pdf'] as const).map(fmt => (
          <button key={fmt} onClick={() => doExport(fmt)} disabled={!!exporting}
            style={{
              padding: '5px 12px', border: '1px solid var(--gray-200)', borderRadius: 6,
              background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: fmt === 'excel' ? '#16a34a' : fmt === 'word' ? '#2563eb' : '#dc2626',
              opacity: exporting === fmt ? 0.6 : 1,
            }}>
            {exporting === fmt ? '...' : fmt.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 500,
          background: 'var(--navy)', color: 'white', padding: '10px 18px',
          borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: 'var(--shadow-lg)', maxWidth: 400,
          animation: 'slideIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
