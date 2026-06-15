import { BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc/channels'

let mainWindow: BrowserWindow | null = null

/** Track the main window as the single source of truth for IPC handlers, and
    push maximize-state changes to the renderer so its controls never go stale
    (snap layouts, title-bar double-click, etc. don't go through our buttons). */
export function registerMainWindow(win: BrowserWindow): void {
  mainWindow = win

  const broadcastMaximizeState = (): void => {
    if (win.isDestroyed()) return
    win.webContents.send(IPC.WINDOW.MAXIMIZE_CHANGED, { isMaximized: win.isMaximized() })
  }

  win.on('maximize', broadcastMaximizeState)
  win.on('unmaximize', broadcastMaximizeState)
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
}

/** The live main window, or null if it isn't open. */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
}
