import React from 'react'
import { Priority, Status, RequirementType } from '../types'

const typeColors: Record<RequirementType, string> = {
  epic: '#7c3aed',
  feature: '#2563eb',
  story: '#16a34a',
}
const typeLabels: Record<RequirementType, string> = {
  epic: 'Эпик',
  feature: 'Фича',
  story: 'История',
}

const priorityColors: Record<Priority, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#16a34a',
}
const priorityLabels: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

const statusColors: Record<Status, string> = {
  draft: '#64748b',
  approved: '#16a34a',
  rejected: '#dc2626',
  in_review: '#d97706',
}
const statusLabels: Record<Status, string> = {
  draft: 'Черновик',
  approved: 'Утверждено',
  rejected: 'Отклонено',
  in_review: 'На проверке',
}

interface BadgeProps {
  value: string
  kind: 'type' | 'priority' | 'status'
  small?: boolean
}

export function Badge({ value, kind, small }: BadgeProps) {
  let color: string, label: string
  if (kind === 'type') {
    color = typeColors[value as RequirementType] ?? '#64748b'
    label = typeLabels[value as RequirementType] ?? value
  } else if (kind === 'priority') {
    color = priorityColors[value as Priority] ?? '#64748b'
    label = priorityLabels[value as Priority] ?? value
  } else {
    color = statusColors[value as Status] ?? '#64748b'
    label = statusLabels[value as Status] ?? value
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

export { typeLabels, priorityLabels, statusLabels, typeColors }
