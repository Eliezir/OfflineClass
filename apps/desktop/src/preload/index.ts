import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { DiscoveryStatus, LoginInput, RegisterInput, Teacher } from '@offlineclass/shared'

const api = {
  discovery: {
    getStatus: (): Promise<DiscoveryStatus> => ipcRenderer.invoke('discovery.getStatus')
  },
  auth: {
    register: (input: RegisterInput): Promise<Teacher> => ipcRenderer.invoke('auth.register', input),
    login: (input: LoginInput): Promise<Teacher> => ipcRenderer.invoke('auth.login', input),
    me: (): Promise<Teacher | null> => ipcRenderer.invoke('auth.me'),
    logout: (): Promise<null> => ipcRenderer.invoke('auth.logout')
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
