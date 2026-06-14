import React from 'react'
import { Priority, Status, RequirementType, TYPE_COLORS, TYPE_LABELS, PRIORITY_LABELS, STATUS_LABELS, STATUS_COLORS } from '../types'

const priorityColors: Record<Priority, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#16a34a',
}

interface BadgeProps {
  value: string
  kind: 'type' | 'priority' | 'status'
  small?: boolean
}

export function Badge({ value, kind, small }: BadgeProps) {
  let color: string, label: string
  if (kind === 'type') {
    color = TYPE_COLORS[value as RequirementType] ?? '#64748b'
    label = TYPE_LABELS[value as RequirementType] ?? value
  } else if (kind === 'priority') {
    color = priorityColors[value as Priority] ?? '#64748b'
    label = PRIORITY_LABELS[value as Priority] ?? value
  } else {
    color = STATUS_COLORS[value as Status] ?? '#64748b'
    label = STATUS_LABELS[value as Status] ?? value
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: small ? '1px 6px' : '2px 8px',
      borderRadius: 99,
      fontSize: small ? 11 : 12,
      fontWeight: 600,
      color,
      background: color + '18',
      border: `1px solid ${color}30`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

export { TYPE_COLORS as typeColors }
