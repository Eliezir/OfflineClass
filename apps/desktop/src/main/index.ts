import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { IPC } from '@shared/ipc/channels'
import { registerIpcHandlers } from './ipc'
import { registerMainWindow, getMainWindow } from './windows'
import { BackendService } from './backend/backend-service'
import icon from '../../resources/icon.png?asset'

let splashWindow: BrowserWindow | null = null
const backend = new BackendService()

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
    title: 'Apresenta.AI',
    webPreferences: {
      preload: join(__dirname, '../preload/splash.js'),
      sandbox: true,
      contextIsolation: true
    }
  })

  splashWindow.once('ready-to-show', () => {
    splashWindow?.show()
  })

  // Re-push the latest status once the page can receive it — covers a fast
  // failure (e.g. backend missing) that resolves before the splash finishes loading.
  splashWindow.webContents.on('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send(IPC.BACKEND.STATUS, backend.getStatus())
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
    /* Custom window chrome: hide the OS title bar so the app draws its own
       40px topbar. macOS keeps the traffic lights inset (Linear/Notion style),
       Windows/Linux go fully frameless and we render close/min/max controls. */
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
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close()
    }
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** Bring the backend up (or attach to a running one), holding the splash until
    it's healthy; only then open the main window. On failure the splash shows its
    error state and waits for the user to retry or quit. */
async function boot(restart = false): Promise<void> {
  const ready = restart ? await backend.restart() : await backend.start()
  if (ready && !getMainWindow()) {
    createWindow()
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.apresenta.ai')

  // Override Electron's default dock icon during dev (macOS).
  // Em produção o ícone vem do app bundle (.icns); essa chamada só afeta
  // quando rodamos via `pnpm dev` e o binário é o Electron.app genérico.
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()

  createSplashWindow()

  // Push backend boot status to the splash (drives the "error" state).
  backend.onStatus((status) => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send(IPC.BACKEND.STATUS, status)
    }
  })

  // Splash controls, available only while startup is failing.
  ipcMain.on(IPC.BACKEND.RETRY, () => void boot(true))
  ipcMain.on(IPC.BACKEND.QUIT, () => app.quit())

  void boot()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Tear down the spawned backend whenever the app actually quits (Cmd+Q,
// last window closed on Win/Linux, or the splash "Sair" button).
app.on('before-quit', () => {
  backend.stop()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
