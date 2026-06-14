import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  req: {
    list: () => ipcRenderer.invoke('req:list'),
    get: (id: number) => ipcRenderer.invoke('req:get', id),
    generateId: (type: string) => ipcRenderer.invoke('req:generateId', type),
    create: (data: unknown) => ipcRenderer.invoke('req:create', data),
    update: (id: number, data: unknown, changedBy: string, comment: string) =>
      ipcRenderer.invoke('req:update', id, data, changedBy, comment),
    delete: (id: number) => ipcRenderer.invoke('req:delete', id),
    versions: (id: number) => ipcRenderer.invoke('req:versions', id),
  },
  export: {
    excel: (requirements: unknown) => ipcRenderer.invoke('export:excel', requirements),
    word: (requirements: unknown) => ipcRenderer.invoke('export:word', requirements),
    pdf: (requirements: unknown) => ipcRenderer.invoke('export:pdf', requirements),
  },
})
