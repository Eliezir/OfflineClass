import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import type { BackendStatus } from '@shared/ipc/backend'
import { IPC } from '@shared/ipc/channels'
import { registerIpcHandlers } from './ipc'
import { registerMainWindow, getMainWindow } from './windows'
import { getDb } from './db/client'
import { runMigrations } from './db/migrate'
import { publishMdns, type MdnsHandle } from './discovery/mdns'
import { findFreePort } from './find-free-port'
import { startServer, type ServerHandle } from './server'
import { Rooms } from './sessions/rooms'
import { ensureSelfSignedCert } from './tls'
import { initAutoUpdater } from './updater'
import icon from '../../resources/icon.png?asset'

const DEFAULT_PORT = 8000

let splashWindow: BrowserWindow | null = null
let serverHandle: ServerHandle | null = null
let mdnsHandle: MdnsHandle | null = null
let rooms: Rooms | null = null
let ipcRegistered = false
let trustedHostnames = new Set<string>()

// Boot status drives the splash (starting → ready / error), like the old
// spawned-backend flow — but now it's the in-process services coming up.
let bootStatus: BackendStatus = { phase: 'starting' }
function setStatus(status: BackendStatus): void {
  bootStatus = status
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send(IPC.BACKEND.STATUS, status)
  }
}

function createSplashWindow(): void {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    resizable: false,
    movable: true,
    center: true,
    show: false,
    skipTaskbar: true,
    alwaysOnTop: false,
    title: 'OfflineClass',
    webPreferences: {
      preload: join(__dirname, '../preload/splash.js'),
      sandbox: true,
      contextIsolation: true
    }
  })

  splashWindow.once('ready-to-show', () => splashWindow?.show())
  // Re-push the latest status once the page can receive it.
  splashWindow.webContents.on('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send(IPC.BACKEND.STATUS, bootStatus)
    }
  })
  splashWindow.on('closed', () => {
    splashWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    splashWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/splash.html`)
  } else {
    splashWindow.loadFile(join(__dirname, '../renderer/splash.html'))
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    /* Custom window chrome: hide the OS title bar so the app draws its own. macOS
       keeps the traffic lights inset; Windows/Linux go frameless. */
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: { x: 14, y: 14 } }
      : { frame: false }),
    ...(process.platform !== 'darwin' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  registerMainWindow(win)

  win.on('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close()
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** Bring the in-process services up (DB + migrations + TLS + LAN server + mDNS +
    IPC), holding the splash until ready. On failure the splash shows its error
    state and waits for retry/quit. Idempotent enough to retry safely. */
async function bootstrap(): Promise<void> {
  setStatus({ phase: 'starting' })
  try {
    const db = getDb()
    runMigrations(db)

    const activeRooms = rooms ?? (rooms = new Rooms())

    const tls = await ensureSelfSignedCert()
    trustedHostnames = new Set(['127.0.0.1', 'localhost', 'offlineclass.local', tls.lanIp])

    if (!serverHandle) {
      const preferredPort = Number(process.env['OFFLINECLASS_PORT'] ?? DEFAULT_PORT)
      const port = await findFreePort(preferredPort)
      serverHandle = await startServer(port, { db, rooms: activeRooms, tls })
      console.log(
        `[server] OfflineClass ouvindo em https://${tls.lanIp}:${serverHandle.port}` +
          (serverHandle.port === preferredPort ? '' : ` (porta ${preferredPort} ocupada)`)
      )
    }

    if (!mdnsHandle) mdnsHandle = await publishMdns(serverHandle.port)

    if (!ipcRegistered) {
      registerIpcHandlers({
        auth: { db },
        discovery: { port: serverHandle.port, mdnsName: mdnsHandle.name },
        exams: { db },
        questions: { db },
        sessions: { db, rooms: activeRooms }
      })
      ipcRegistered = true
    }

    setStatus({ phase: 'ready' })
    if (!getMainWindow()) createWindow()
  } catch (err) {
    setStatus({ phase: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}

// Electron blocks self-signed certs by default; trust ours for the hostnames we serve.
function setupCertTrust(): void {
  app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
    try {
      if (trustedHostnames.has(new URL(url).hostname)) {
        event.preventDefault()
        callback(true)
        return
      }
    } catch {
      /* fall through */
    }
    callback(false)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.offlineclass.app')

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupCertTrust()
  createSplashWindow()

  // Background update check (packaged builds only; silent when offline).
  initAutoUpdater(getMainWindow)

  // Splash controls, available while startup is failing.
  ipcMain.on(IPC.BACKEND.RETRY, () => void bootstrap())
  ipcMain.on(IPC.BACKEND.QUIT, () => app.quit())

  void bootstrap()

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
