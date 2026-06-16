export type RequirementType = 'is' | 'mod' | 'bf' | 'ft'
export type Priority = 'high' | 'medium' | 'low'
export type Status = 'draft' | 'approved' | 'rejected' | 'in_review' | 'rework'

export interface Requirement {
  id: number
  req_id: string
  title: string
  description: string
  full_description: string
  type: RequirementType
  parent_id: number | null
  priority: Priority
  status: Status
  cenn: string
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
  full_description: string
  type: string
  parent_id: number | null
  priority: string
  status: string
  cenn: string
  author: string
  changed_by: string
  change_comment: string
  changed_at: string
}

export interface Remark {
  id: number
  ft_id: number
  num_remark: string
  text_remark: string
  status: 'open' | 'in_work' | 'closed'
  author: string
  created_at: string
}

export interface Approval {
  id: number
  ft_id: number
  status: 'in_review' | 'approved' | 'rework' | 'rejected'
  comment: string
  changed_by: string
  changed_at: string
}

export interface User {
  id: number
  name: string
  role: 'admin' | 'user'
  created_at: string
}

export interface TreeNode {
  requirement: Requirement
  children: TreeNode[]
}

export const TYPE_LABELS: Record<RequirementType, string> = {
  is: 'ИС',
  mod: 'МД',
  bf: 'БФ',
  ft: 'ФТ',
}

export const TYPE_LONG_LABELS: Record<RequirementType, string> = {
  is: 'Информационная система',
  mod: 'Модуль',
  bf: 'Функциональный блок',
  ft: 'Функциональное требование',
}

export const TYPE_COLORS: Record<RequirementType, string> = {
  is: '#7c3aed',
  mod: '#0891b2',
  bf: '#2563eb',
  ft: '#16a34a',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

export const STATUS_LABELS: Record<Status, string> = {
  draft: 'Черновик',
  in_review: 'На согласовании',
  approved: 'Согласовано',
  rework: 'На доработке',
  rejected: 'Отклонено',
}

export const STATUS_COLORS: Record<Status, string> = {
  draft: '#64748b',
  in_review: '#d97706',
  approved: '#16a34a',
  rework: '#ea580c',
  rejected: '#dc2626',
}

declare global {
  interface Window {
    api: {
      req: {
        list: () => Promise<Requirement[]>
        get: (id: number) => Promise<Requirement | undefined>
        generateId: (type: RequirementType, parentId?: number | null) => Promise<string>
        create: (data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>) => Promise<Requirement>
        update: (id: number, data: Partial<Requirement>, changedBy: string, comment: string) => Promise<Requirement>
        delete: (id: number) => Promise<boolean>
        versions: (id: number) => Promise<RequirementVersion[]>
      }
      remark: {
        list: (ftId: number) => Promise<Remark[]>
        create: (data: Omit<Remark, 'id' | 'created_at'>) => Promise<Remark>
        update: (id: number, data: Partial<Pick<Remark, 'status' | 'text_remark' | 'num_remark'>>) => Promise<void>
        delete: (id: number) => Promise<boolean>
      }
      approval: {
        list: (ftId: number) => Promise<Approval[]>
        create: (data: Omit<Approval, 'id' | 'changed_at'>) => Promise<Approval>
        update: (id: number, data: Partial<Pick<Approval, 'status' | 'comment' | 'changed_by'>>) => Promise<boolean>
        lastStatus: (ftId: number) => Promise<Approval | undefined>
      }
      user: {
        list: () => Promise<User[]>
        create: (data: Pick<User, 'name' | 'role'>) => Promise<User>
        update: (id: number, data: Partial<Pick<User, 'name' | 'role'>>) => Promise<boolean>
        delete: (id: number) => Promise<boolean>
      }
      export: {
        excel: (requirements: Requirement[]) => Promise<{ ok: boolean; filePath?: string }>
        word: (requirements: Requirement[]) => Promise<{ ok: boolean; filePath?: string }>
        pdf: (requirements: Requirement[]) => Promise<{ ok: boolean; filePath?: string }>
      }
    }
  }
}
