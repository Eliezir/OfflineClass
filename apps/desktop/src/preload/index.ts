import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  IpcBridge,
  IpcChannel,
  IpcEventChannel,
  IpcEventPayload,
  IpcInput,
  IpcOutput
} from '@shared/ipc/contract'

const api: IpcBridge = {
  invoke<C extends IpcChannel>(
    channel: C,
    ...args: IpcInput<C> extends undefined ? [] : [input: IpcInput<C>]
  ): Promise<IpcOutput<C>> {
    return ipcRenderer.invoke(channel, args[0]) as Promise<IpcOutput<C>>
  },
  on<C extends IpcEventChannel>(channel: C, listener: (payload: IpcEventPayload<C>) => void) {
    const handler = (_event: IpcRendererEvent, payload: IpcEventPayload<C>): void =>
      listener(payload)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
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
