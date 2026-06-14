import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import {
  listRequirements, getRequirement, createRequirement, updateRequirement,
  deleteRequirement, getVersions, generateReqId, Requirement,
  listRemarks, createRemark, updateRemark, deleteRemark,
  listApprovals, createApproval, getLastApproval,
} from './database'
import { exportToExcel, exportToWord, exportToPdf } from './export'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#f8fafc',
    title: 'СУИД — Управление требованиями',
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function registerIpcHandlers() {
  // Requirements
  ipcMain.handle('req:list', () => listRequirements())
  ipcMain.handle('req:get', (_e, id: number) => getRequirement(id))
  ipcMain.handle('req:generateId', (_e, type: 'is' | 'bf' | 'ft', parentId?: number | null) =>
    generateReqId(type, parentId)
  )
  ipcMain.handle('req:create', (_e, data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>) =>
    createRequirement(data)
  )
  ipcMain.handle('req:update', (_e, id: number, data: Partial<Requirement>, changedBy: string, comment: string) =>
    updateRequirement(id, data, changedBy, comment)
  )
  ipcMain.handle('req:delete', (_e, id: number) => { deleteRequirement(id); return true })
  ipcMain.handle('req:versions', (_e, id: number) => getVersions(id))

  // Remarks
  ipcMain.handle('remark:list', (_e, ftId: number) => listRemarks(ftId))
  ipcMain.handle('remark:create', (_e, data: Parameters<typeof createRemark>[0]) => createRemark(data))
  ipcMain.handle('remark:update', (_e, id: number, data: Parameters<typeof updateRemark>[1]) => updateRemark(id, data))
  ipcMain.handle('remark:delete', (_e, id: number) => { deleteRemark(id); return true })

  // Approvals
  ipcMain.handle('approval:list', (_e, ftId: number) => listApprovals(ftId))
  ipcMain.handle('approval:create', (_e, data: Parameters<typeof createApproval>[0]) => createApproval(data))
  ipcMain.handle('approval:lastStatus', (_e, ftId: number) => getLastApproval(ftId))

  // Exports
  ipcMain.handle('export:excel', async (_e, requirements: Requirement[]) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Экспорт в Excel',
      defaultPath: `suид-требования-${Date.now()}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    })
    if (!filePath) return { ok: false }
    await exportToExcel(requirements, filePath)
    return { ok: true, filePath }
  })

  ipcMain.handle('export:word', async (_e, requirements: Requirement[]) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Экспорт в Word',
      defaultPath: `суид-требования-${Date.now()}.docx`,
      filters: [{ name: 'Word', extensions: ['docx'] }],
    })
    if (!filePath) return { ok: false }
    await exportToWord(requirements, filePath)
    return { ok: true, filePath }
  })

  ipcMain.handle('export:pdf', async (_e, requirements: Requirement[]) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Экспорт в PDF',
      defaultPath: `суид-требования-${Date.now()}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (!filePath) return { ok: false }
    exportToPdf(requirements, filePath)
    return { ok: true, filePath }
  })
}
