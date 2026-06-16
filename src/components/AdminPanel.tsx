import React, { useState, useEffect } from 'react'
import { User } from '../types'

interface AdminPanelProps {
  onClose: () => void
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([])
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => window.api.user.list().then(setUsers).catch(() => {})
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true); setError('')
    try {
      await window.api.user.create({ name: newName.trim(), role: newRole })
      setNewName('')
      load()
    } catch {
      setError('Пользователь с таким именем уже существует')
    } finally { setSaving(false) }
  }

  const startEdit = (u: User) => {
    setEditId(u.id); setEditName(u.name); setEditRole(u.role as 'admin' | 'user')
  }

  const handleSave = async () => {
    if (!editId || !editName.trim()) return
    setSaving(true)
    try {
      await window.api.user.update(editId, { name: editName.trim(), role: editRole })
      setEditId(null); load()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    await window.api.user.delete(id); load()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 580, maxHeight: '85vh', background: 'var(--card-bg)', borderRadius: 16,
        boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--gray-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--gray-900)' }}>Управление пользователями</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
              Пользователи доступны в выпадающих списках ФИО
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 140px 80px',
          padding: '8px 24px', background: 'var(--gray-50)',
          borderBottom: '1px solid var(--gray-200)',
          fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <span>ФИО</span><span>Роль</span><span></span>
        </div>

        {/* User list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {users.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
              Нет пользователей
            </div>
          )}
          {users.map(u => (
            <div key={u.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 80px',
              alignItems: 'center', padding: '0 24px',
              borderBottom: '1px solid var(--gray-100)', minHeight: 52,
            }}>
              {editId === u.id ? (
                <>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    style={inputStyle} autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditId(null) }} />
                  <select value={editRole} onChange={e => setEditRole(e.target.value as 'admin' | 'user')}
                    style={{ ...inputStyle, marginLeft: 8 }}>
                    <option value="user">Пользователь</option>
                    <option value="admin">Администратор</option>
                  </select>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                    <button onClick={handleSave} disabled={saving}
                      style={{ padding: '4px 10px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {saving ? '...' : 'OK'}
                    </button>
                    <button onClick={() => setEditId(null)}
                      style={{ padding: '4px 8px', background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: 'var(--gray-700)' }}>
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-800)' }}>{u.name}</span>
                  <span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                      background: u.role === 'admin' ? 'var(--navy)' : 'var(--gray-100)',
                      color: u.role === 'admin' ? 'white' : 'var(--gray-600)',
                    }}>
                      {u.role === 'admin' ? 'Администратор' : 'Пользователь'}
                    </span>
                  </span>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => startEdit(u)} style={iconBtn} title="Редактировать">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(u.id)} style={{ ...iconBtn, color: '#dc2626' }} title="Удалить">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add form */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-600)' }}>ФИО нового пользователя</label>
              <input value={newName} onChange={e => { setNewName(e.target.value); setError('') }}
                placeholder="Иванов Иван Иванович" style={inputStyle}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-600)' }}>Роль</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'user')} style={{ ...inputStyle, width: 150 }}>
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <button onClick={handleAdd} disabled={saving || !newName.trim()}
              style={{
                padding: '8px 18px', background: 'var(--navy)', color: 'white',
                border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                opacity: saving || !newName.trim() ? 0.6 : 1, flexShrink: 0,
              }}>
              + Добавить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px',
  border: '1px solid var(--gray-200)', borderRadius: 7,
  fontSize: 13, outline: 'none', color: 'var(--gray-800)',
  background: 'var(--card-bg)', boxSizing: 'border-box',
}

const iconBtn: React.CSSProperties = {
  padding: '5px', border: '1px solid var(--gray-200)', borderRadius: 6,
  background: 'var(--card-bg)', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)',
}
