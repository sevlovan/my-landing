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
  const epics = requirements.filter(r => r.type === 'epic')
  const features = requirements.filter(r => r.type === 'feature')
  const stories = requirements.filter(r => r.type === 'story')

  return epics.map(epic => ({
    requirement: epic,
    children: features
      .filter(f => f.parent_id === epic.id)
      .map(feature => ({
        requirement: feature,
        children: stories
          .filter(s => s.parent_id === feature.id)
          .map(story => ({ requirement: story, children: [] })),
      })),
  }))
}
