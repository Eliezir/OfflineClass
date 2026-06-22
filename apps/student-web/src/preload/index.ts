import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

export interface DiscoveryResult {
  url: string
  name: string
}

const api = {
  discovery: {
    start: (): void => ipcRenderer.send('discovery:start'),
    restart: (): void => ipcRenderer.send('discovery:restart'),
    onFound: (callback: (result: DiscoveryResult) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, result: DiscoveryResult): void =>
        callback(result)
      ipcRenderer.on('discovery:found', handler)
      return () => ipcRenderer.removeListener('discovery:found', handler)
    }
  },
  server: {
    setUrl: (url: string): Promise<void> => ipcRenderer.invoke('server:set-url', url),
    getUrl: (): Promise<string | null> => ipcRenderer.invoke('server:get-url')
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximizeToggle: (): Promise<{ isMaximized: boolean }> =>
      ipcRenderer.invoke('window:maximize-toggle'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
    isMaximized: (): Promise<{ isMaximized: boolean }> =>
      ipcRenderer.invoke('window:is-maximized'),
    /** Subscribe to maximize-state changes pushed from main. Returns unsubscribe. */
    onMaximizeChanged: (callback: (isMaximized: boolean) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, payload: { isMaximized: boolean }): void =>
        callback(payload.isMaximized)
      ipcRenderer.on('window:maximize-changed', handler)
      return () => ipcRenderer.removeListener('window:maximize-changed', handler)
    }
  }
}

export type StudentApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
}
