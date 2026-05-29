import { app } from 'electron'
import { IPC } from '@shared/ipc/channels'
import { registerHandler } from '../register'

export function registerAppHandlers(): void {
  registerHandler(IPC.APP.GET_VERSION, () => ({
    version: app.getVersion()
  }))
}
