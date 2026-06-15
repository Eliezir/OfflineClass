import { IPC } from '@shared/ipc/channels'
import { registerHandler } from '../register'
import { getMainWindow } from '../../windows'

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
