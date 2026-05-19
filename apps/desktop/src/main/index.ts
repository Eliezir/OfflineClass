import { app, shell, BrowserWindow } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'node:path'

import icon from '../../resources/icon.png?asset'
import { getDb } from './db/client'
import { runMigrations } from './db/migrate'
import { publishMdns, type MdnsHandle } from './discovery/mdns'
import { registerIpcHandlers } from './ipc'
import { startServer, type ServerHandle } from './server'

const DEFAULT_PORT = 8000

let serverHandle: ServerHandle | null = null
let mdnsHandle: MdnsHandle | null = null

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function bootstrap(): Promise<void> {
  const port = Number(process.env['OFFLINECLASS_PORT'] ?? DEFAULT_PORT)

  // 1. Migrate DB (creates the file under userData on first run).
  const db = getDb()
  runMigrations(db)

  // 2. Start the LAN-facing Hono server (HTTP + WS upgrade).
  serverHandle = await startServer(port)

  // 3. Announce the service over mDNS so students can hit offlineclass.local.
  mdnsHandle = await publishMdns(serverHandle.port)

  // 4. Wire IPC handlers — depends on the server (for port) and mDNS (for name).
  registerIpcHandlers({
    auth: { db },
    discovery: { port: serverHandle.port, mdnsName: mdnsHandle.name },
    exams: { db },
    questions: { db }
  })

  // 5. UI.
  createWindow()
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.offlineclass.app')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    await bootstrap()
  } catch (err) {
    console.error('[bootstrap] failed:', err)
    app.quit()
    return
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async (event) => {
  if (!serverHandle && !mdnsHandle) return
  event.preventDefault()
  try {
    await mdnsHandle?.unpublish()
    await serverHandle?.stop()
  } finally {
    serverHandle = null
    mdnsHandle = null
    app.quit()
  }
})
