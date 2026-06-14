import { useState, useEffect, useCallback } from 'react'
import { Requirement, TreeNode } from '../types'

export function useRequirements() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.req.list()
      setRequirements(data)
    } catch (err) {
      console.error('Failed to load requirements:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>) => {
    const req = await window.api.req.create(data)
    await load()
    return req
  }, [load])

  const update = useCallback(async (id: number, data: Partial<Requirement>, changedBy: string, comment = '') => {
    const req = await window.api.req.update(id, data, changedBy, comment)
    await load()
    return req
  }, [load])

  const remove = useCallback(async (id: number) => {
    await window.api.req.delete(id)
    await load()
  }, [load])

  return { requirements, loading, load, create, update, remove }
}

export function buildTree(requirements: Requirement[]): TreeNode[] {
  const isSystems = requirements.filter(r => r.type === 'is')
  const bfBlocks = requirements.filter(r => r.type === 'bf')
  const ftItems = requirements.filter(r => r.type === 'ft')

  return isSystems.map(is => ({
    requirement: is,
    children: bfBlocks
      .filter(bf => bf.parent_id === is.id)
      .map(bf => ({
        requirement: bf,
        children: ftItems
          .filter(ft => ft.parent_id === bf.id)
          .map(ft => ({ requirement: ft, children: [] })),
      })),
  }))
}
