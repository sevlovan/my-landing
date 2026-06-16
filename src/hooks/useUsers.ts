import { useState, useEffect, useCallback } from 'react'
import { User } from '../types'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])

  const load = useCallback(async () => {
    const data = await window.api.user.list()
    setUsers(data)
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (data: Pick<User, 'name' | 'role'>) => {
    await window.api.user.create(data)
    await load()
  }, [load])

  const update = useCallback(async (id: number, data: Partial<Pick<User, 'name' | 'role'>>) => {
    await window.api.user.update(id, data)
    await load()
  }, [load])

  const remove = useCallback(async (id: number) => {
    await window.api.user.delete(id)
    await load()
  }, [load])

  return { users, load, create, update, remove }
}
