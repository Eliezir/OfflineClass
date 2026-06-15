import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC } from '@shared/ipc/channels'
import type { BackendStatus } from '@shared/ipc/backend'

/* Minimal bridge for the splash window: receive backend boot status and let the
   user retry or quit if startup fails. Kept separate from the main preload so the
   splash can stay sandboxed and decoupled from the renderer's IPC contract. */
const splash = {
  onStatus(callback: (status: BackendStatus) => void): () => void {
    const handler = (_event: IpcRendererEvent, status: BackendStatus): void => callback(status)
    ipcRenderer.on(IPC.BACKEND.STATUS, handler)
    return () => ipcRenderer.removeListener(IPC.BACKEND.STATUS, handler)
  },
  retry(): void {
    ipcRenderer.send(IPC.BACKEND.RETRY)
  },
  quit(): void {
    ipcRenderer.send(IPC.BACKEND.QUIT)
  }
}

contextBridge.exposeInMainWorld('splash', splash)
