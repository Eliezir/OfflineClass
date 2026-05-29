import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { IpcBridge, IpcChannel, IpcInput, IpcOutput } from '@shared/ipc/contract'

const api: IpcBridge = {
  invoke<C extends IpcChannel>(
    channel: C,
    ...args: IpcInput<C> extends undefined ? [] : [input: IpcInput<C>]
  ): Promise<IpcOutput<C>> {
    return ipcRenderer.invoke(channel, args[0]) as Promise<IpcOutput<C>>
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
