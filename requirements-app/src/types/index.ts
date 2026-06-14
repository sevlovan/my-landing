export type RequirementType = 'epic' | 'feature' | 'story'
export type Priority = 'high' | 'medium' | 'low'
export type Status = 'draft' | 'approved' | 'rejected' | 'in_review'

export interface Requirement {
  id: number
  req_id: string
  title: string
  description: string
  type: RequirementType
  parent_id: number | null
  priority: Priority
  status: Status
  author: string
  created_at: string
  updated_at: string
}

export interface RequirementVersion {
  id: number
  requirement_id: number
  version: number
  title: string
  description: string
  type: string
  parent_id: number | null
  priority: string
  status: string
  author: string
  changed_by: string
  change_comment: string
  changed_at: string
}

export interface TreeNode {
  requirement: Requirement
  children: TreeNode[]
}

declare global {
  interface Window {
    api: {
      req: {
        list: () => Promise<Requirement[]>
        get: (id: number) => Promise<Requirement | undefined>
        generateId: (type: RequirementType) => Promise<string>
        create: (data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>) => Promise<Requirement>
        update: (id: number, data: Partial<Requirement>, changedBy: string, comment: string) => Promise<Requirement>
        delete: (id: number) => Promise<boolean>
        versions: (id: number) => Promise<RequirementVersion[]>
      }
      export: {
        excel: (requirements: Requirement[]) => Promise<{ ok: boolean; filePath?: string }>
        word: (requirements: Requirement[]) => Promise<{ ok: boolean; filePath?: string }>
        pdf: (requirements: Requirement[]) => Promise<{ ok: boolean; filePath?: string }>
      }
    }
  }
}
