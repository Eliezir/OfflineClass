import type { ElectronAPI } from '@electron-toolkit/preload'
import type { IpcBridge } from '@shared/ipc/contract'

declare global {
  interface Window {
    electron: ElectronAPI
    api: IpcBridge
  }
}
