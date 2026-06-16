import React from 'react'
import { User } from '../types'

interface UserSelectProps {
  value: string
  onChange: (v: string) => void
  users: User[]
  placeholder?: string
  style?: React.CSSProperties
}

export function UserSelect({ value, onChange, users, placeholder = 'выберите', style }: UserSelectProps) {
  const isLegacy = value && !users.find(u => u.name === value)
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={style}>
      <option value="">— {placeholder} —</option>
      {isLegacy && <option value={value}>{value}</option>}
      {users.map(u => (
        <option key={u.id} value={u.name}>{u.name}</option>
      ))}
    </select>
  )
}
