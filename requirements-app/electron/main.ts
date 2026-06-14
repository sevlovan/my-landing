import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import {
  listRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  getVersions,
  generateReqId,
  Requirement,
} from './database'
import { exportToExcel, exportToWord, exportToPdf } from './export'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#f8fafc',
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
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
  ipcMain.handle('req:list', () => listRequirements())

  ipcMain.handle('req:get', (_e, id: number) => getRequirement(id))

  ipcMain.handle('req:generateId', (_e, type: 'epic' | 'feature' | 'story') => generateReqId(type))

  ipcMain.handle('req:create', (_e, data: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>) => {
    return createRequirement(data)
  })

  ipcMain.handle('req:update', (_e, id: number, data: Partial<Requirement>, changedBy: string, comment: string) => {
    return updateRequirement(id, data, changedBy, comment)
  })

  ipcMain.handle('req:delete', (_e, id: number) => {
    deleteRequirement(id)
    return true
  })

  ipcMain.handle('req:versions', (_e, id: number) => getVersions(id))

  ipcMain.handle('export:excel', async (_e, requirements: Requirement[]) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Экспорт в Excel',
      defaultPath: `requirements-${Date.now()}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    })
    if (!filePath) return { ok: false }
    await exportToExcel(requirements, filePath)
    return { ok: true, filePath }
  })

  ipcMain.handle('export:word', async (_e, requirements: Requirement[]) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Экспорт в Word',
      defaultPath: `requirements-${Date.now()}.docx`,
      filters: [{ name: 'Word Document', extensions: ['docx'] }],
    })
    if (!filePath) return { ok: false }
    await exportToWord(requirements, filePath)
    return { ok: true, filePath }
  })

  ipcMain.handle('export:pdf', async (_e, requirements: Requirement[]) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Экспорт в PDF',
      defaultPath: `requirements-${Date.now()}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (!filePath) return { ok: false }
    exportToPdf(requirements, filePath)
    return { ok: true, filePath }
  })
}
