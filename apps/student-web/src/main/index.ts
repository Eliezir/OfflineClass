import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import { Bonjour } from 'bonjour-service'
import icon from '../../resources/icon.png?asset'

// Self-signed cert from the teacher's LAN server must be accepted.
// The certificate-error handler below covers frame navigation; this
// switch covers fetch() / XHR subresource requests from the renderer.
app.commandLine.appendSwitch('ignore-certificate-errors')

// ── IPC channel names (kept simple — no shared/ipc contract needed) ──────
const IPC = {
  DISCOVERY_START: 'discovery:start',
  DISCOVERY_RESTART: 'discovery:restart',
  DISCOVERY_FOUND: 'discovery:found',
  SERVER_SET_URL: 'server:set-url',
  SERVER_GET_URL: 'server:get-url',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE_TOGGLE: 'window:maximize-toggle',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',
  WINDOW_MAXIMIZE_CHANGED: 'window:maximize-changed'
} as const

// ── State ─────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null
let bonjour: Bonjour | null = null
let found = false
let teacherUrl: string | null = null

// ── mDNS discovery ────────────────────────────────────────────────────────
function startDiscovery(): void {
  // Always stop any previous scan first (idempotent restart).
  stopDiscovery()

  bonjour = new Bonjour()
  found = false

  // Discover _https services on the LAN — the teacher publishes as
  // "offlineclass" via bonjour-service with type "https".
  bonjour.find({ type: 'https' }, (service) => {
    if (found) return
    if (service.name === 'offlineclass' || service.name?.startsWith('offlineclass')) {
      found = true

      // Prefer the mDNS-resolvable hostname over raw IPs. The teacher
      // publishes `host: 'offlineclass.local'` which resolves to the
      // same LAN IP that the teacher's discovery.getStatus reports.
      const host = service.host ?? service.addresses?.[0] ?? 'offlineclass.local'
      const port = service.port ?? 8000
      const url = `https://${host}:${port}`

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC.DISCOVERY_FOUND, { url, name: service.name })
      }
    }
  })
}

function stopDiscovery(): void {
  if (bonjour) {
    bonjour.destroy()
    bonjour = null
  }
}

// ── Window ────────────────────────────────────────────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'OfflineClass — Aluno',
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: { x: 14, y: 14 } }
      : { frame: false }),
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // Cross-origin calls to the teacher's LAN server need this off.
      // Safe: the only remote the app contacts is the teacher over LAN.
      webSecurity: false
    }
  })

  // Broadcast maximize state changes to the renderer so the window-control
  // buttons never go stale (snap layouts, title-bar double-click, etc.).
  const broadcastMaximize = (): void => {
    if (mainWindow?.isDestroyed()) return
    mainWindow?.webContents.send(IPC.WINDOW_MAXIMIZE_CHANGED, {
      isMaximized: mainWindow?.isMaximized() ?? false
    })
  }
  mainWindow.on('maximize', broadcastMaximize)
  mainWindow.on('unmaximize', broadcastMaximize)

  mainWindow.on('ready-to-show', () => mainWindow?.show())

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

// ── IPC handlers ──────────────────────────────────────────────────────────
function registerIpc(): void {
  ipcMain.on(IPC.DISCOVERY_START, () => startDiscovery())
  ipcMain.on(IPC.DISCOVERY_RESTART, () => startDiscovery())

  ipcMain.handle(IPC.SERVER_SET_URL, (_event, url: string) => {
    teacherUrl = url
    stopDiscovery()
  })

  ipcMain.handle(IPC.SERVER_GET_URL, () => teacherUrl)

  // ── Window controls (for frameless Windows/Linux) ───────────────────
  ipcMain.handle(IPC.WINDOW_MINIMIZE, () => mainWindow?.minimize())
  ipcMain.handle(IPC.WINDOW_MAXIMIZE_TOGGLE, () => {
    const w = mainWindow
    if (!w) return { isMaximized: false }
    w.isMaximized() ? w.unmaximize() : w.maximize()
    return { isMaximized: w.isMaximized() }
  })
  ipcMain.handle(IPC.WINDOW_CLOSE, () => mainWindow?.close())
  ipcMain.handle(IPC.WINDOW_IS_MAXIMIZED, () => ({
    isMaximized: mainWindow?.isMaximized() ?? false
  }))
}

// ── App lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.offlineclass.student')

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }

  // Bypass self-signed cert errors for LAN connections.
  app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
    try {
      const hostname = new URL(url).hostname
      // Trust LAN IPs and .local hostnames.
      if (
        hostname.endsWith('.local') ||
        /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1'
      ) {
        event.preventDefault()
        callback(true)
        return
      }
    } catch {
      /* fall through */
    }
    callback(false)
  })

  registerIpc()
  createWindow()

  // Auto-start mDNS discovery once the window is ready to receive events.
  if (mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => startDiscovery())
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopDiscovery()
  if (process.platform !== 'darwin') app.quit()
})
