import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  req: {
    list: () => ipcRenderer.invoke('req:list'),
    get: (id: number) => ipcRenderer.invoke('req:get', id),
    generateId: (type: string, parentId?: number | null) => ipcRenderer.invoke('req:generateId', type, parentId),
    create: (data: unknown) => ipcRenderer.invoke('req:create', data),
    update: (id: number, data: unknown, changedBy: string, comment: string) =>
      ipcRenderer.invoke('req:update', id, data, changedBy, comment),
    delete: (id: number) => ipcRenderer.invoke('req:delete', id),
    versions: (id: number) => ipcRenderer.invoke('req:versions', id),
  },
  remark: {
    list: (ftId: number) => ipcRenderer.invoke('remark:list', ftId),
    create: (data: unknown) => ipcRenderer.invoke('remark:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('remark:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('remark:delete', id),
  },
  approval: {
    list: (ftId: number) => ipcRenderer.invoke('approval:list', ftId),
    create: (data: unknown) => ipcRenderer.invoke('approval:create', data),
    lastStatus: (ftId: number) => ipcRenderer.invoke('approval:lastStatus', ftId),
  },
  export: {
    excel: (requirements: unknown) => ipcRenderer.invoke('export:excel', requirements),
    word: (requirements: unknown) => ipcRenderer.invoke('export:word', requirements),
    pdf: (requirements: unknown) => ipcRenderer.invoke('export:pdf', requirements),
  },
})
