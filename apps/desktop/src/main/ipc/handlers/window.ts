import { BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc/channels'
import { registerHandler } from '../register'

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows().find((w) => !w.isDestroyed() && w.isVisible()) ??
    BrowserWindow.getAllWindows()[0] ??
    null
}

export function registerWindowHandlers(): void {
  registerHandler(IPC.WINDOW.MINIMIZE, () => {
    getMainWindow()?.minimize()
  })

  registerHandler(IPC.WINDOW.MAXIMIZE_TOGGLE, () => {
    const w = getMainWindow()
    if (!w) return { isMaximized: false }
    if (w.isMaximized()) {
      w.unmaximize()
    } else {
      w.maximize()
    }
    return { isMaximized: w.isMaximized() }
  })

  registerHandler(IPC.WINDOW.CLOSE, () => {
    getMainWindow()?.close()
  })

  registerHandler(IPC.WINDOW.IS_MAXIMIZED, () => {
    return { isMaximized: getMainWindow()?.isMaximized() ?? false }
  })
}
