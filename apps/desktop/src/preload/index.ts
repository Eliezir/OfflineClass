import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { DiscoveryStatus } from '@offlineclass/shared'

const api = {
  discovery: {
    getStatus: (): Promise<DiscoveryStatus> => ipcRenderer.invoke('discovery.getStatus')
  }
}

export type ApiSurface = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (defined in dts)
  window.electron = electronAPI
  // @ts-ignore (defined in dts)
  window.api = api
}
