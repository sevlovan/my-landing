import React, { useState } from 'react'
import { Requirement, TreeNode, TYPE_COLORS } from '../types'
import { Badge } from './Badge'
import { buildTree } from '../hooks/useRequirements'

interface SidebarProps {
  requirements: Requirement[]
  selectedId: number | null
  onSelect: (req: Requirement) => void
  onNew: (type: 'is' | 'bf' | 'ft', parentId?: number) => void
  search: string
  onSearchChange: (v: string) => void
}

export function Sidebar({ requirements, selectedId, onSelect, onNew, search, onSearchChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const toggle = (id: number) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = search.trim()
    ? requirements.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.req_id.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : null

  const tree = buildTree(requirements)
  const isCount = requirements.filter(r => r.type === 'is').length
  const bfCount = requirements.filter(r => r.type === 'bf').length
  const ftCount = requirements.filter(r => r.type === 'ft').length

  return (
    <aside style={{
      width: 300, minWidth: 240, maxWidth: 380, display: 'flex', flexDirection: 'column',
      background: 'white', borderRight: '1px solid var(--gray-200)', height: '100vh', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>СУИД — Требования</div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
              {isCount} ИС · {bfCount} БФ · {ftCount} ФТ
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: 9, pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search} onChange={e => onSearchChange(e.target.value)}
            placeholder="Поиск по реестру..."
            style={{
              width: '100%', padding: '7px 10px 7px 30px',
              border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
              fontSize: 13, outline: 'none', background: 'var(--gray-50)',
              color: 'var(--gray-700)',
            }}
          />
        </div>
      </div>

      {/* Add buttons */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: 6 }}>
        {(['is', 'bf', 'ft'] as const).map(type => (
          <button key={type} onClick={() => onNew(type)}
            style={{
              flex: 1, padding: '5px 4px', border: `1px solid ${TYPE_COLORS[type]}30`,
              borderRadius: 6, fontSize: 11, fontWeight: 700, color: TYPE_COLORS[type],
              background: TYPE_COLORS[type] + '10', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = TYPE_COLORS[type] + '20')}
            onMouseLeave={e => (e.currentTarget.style.background = TYPE_COLORS[type] + '10')}
          >
            + {type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {filtered ? (
          filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              Ничего не найдено
            </div>
          ) : (
            filtered.map(req => (
              <FlatItem key={req.id} req={req} selected={selectedId === req.id} onClick={() => onSelect(req)} />
            ))
          )
        ) : (
          tree.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              Нет данных.<br />Создайте первую ИС!
            </div>
          ) : (
            tree.map(node => (
              <TreeItem
                key={node.requirement.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                collapsed={collapsed}
                onToggle={toggle}
                onSelect={onSelect}
                onNew={onNew}
              />
            ))
          )
        )}
      </div>
    </aside>
  )
}

function FlatItem({ req, selected, onClick }: { req: Requirement; selected: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: '7px 16px', cursor: 'pointer',
      background: selected ? 'var(--blue-light)' : 'transparent',
      borderLeft: selected ? '3px solid var(--blue)' : '3px solid transparent',
      display: 'flex', flexDirection: 'column', gap: 3,
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--gray-50)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Badge value={req.type} kind="type" small />
        <span style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'monospace' }}>{req.req_id}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', lineHeight: 1.3 }}>{req.title}</span>
    </div>
  )
}

interface TreeItemProps {
  node: TreeNode
  depth: number
  selectedId: number | null
  collapsed: Set<number>
  onToggle: (id: number) => void
  onSelect: (req: Requirement) => void
  onNew: (type: 'is' | 'bf' | 'ft', parentId?: number) => void
}

function TreeItem({ node, depth, selectedId, collapsed, onToggle, onSelect, onNew }: TreeItemProps) {
  const { requirement, children } = node
  const isCollapsed = collapsed.has(requirement.id)
  const isSelected = selectedId === requirement.id
  const hasChildren = children.length > 0
  const indent = depth * 16

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: `6px 12px 6px ${16 + indent}px`,
          cursor: 'pointer',
          background: isSelected ? 'var(--blue-light)' : 'transparent',
          borderLeft: isSelected ? '3px solid var(--blue)' : '3px solid transparent',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--gray-50)' }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
      >
        <button
          onClick={e => { e.stopPropagation(); hasChildren && onToggle(requirement.id) }}
          style={{
            width: 16, height: 16, border: 'none', background: 'none', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gray-400)', flexShrink: 0,
            visibility: hasChildren ? 'visible' : 'hidden',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: TYPE_COLORS[requirement.type],
        }} />

        <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelect(requirement)}>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'monospace' }}>{requirement.req_id}</div>
          <div style={{
            fontSize: 13, fontWeight: depth === 0 ? 600 : 500,
            color: 'var(--gray-800)', lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {requirement.title}
          </div>
        </div>

        {requirement.type !== 'ft' && (
          <button
            onClick={e => {
              e.stopPropagation()
              const childType = requirement.type === 'is' ? 'bf' : 'ft'
              onNew(childType, requirement.id)
            }}
            style={{
              width: 20, height: 20, border: 'none', background: 'none', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gray-400)', borderRadius: 4, flexShrink: 0, opacity: 0,
            }}
            className="add-child-btn"
            title={requirement.type === 'is' ? 'Добавить БФ' : 'Добавить ФТ'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      {!isCollapsed && children.map(child => (
        <TreeItem
          key={child.requirement.id}
          node={child}
          depth={depth + 1}
          selectedId={selectedId}
          collapsed={collapsed}
          onToggle={onToggle}
          onSelect={onSelect}
          onNew={onNew}
        />
      ))}
    </div>
  )
}
