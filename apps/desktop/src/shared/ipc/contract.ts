import type { z } from 'zod'
import { IPC } from './channels'
import { AppGetVersionInputSchema, AppGetVersionOutputSchema } from './app'
import {
  WindowCloseInputSchema,
  WindowCloseOutputSchema,
  WindowIsMaximizedInputSchema,
  WindowIsMaximizedOutputSchema,
  WindowMaximizeChangedEventSchema,
  WindowMaximizeToggleInputSchema,
  WindowMaximizeToggleOutputSchema,
  WindowMinimizeInputSchema,
  WindowMinimizeOutputSchema
} from './window'

export const IpcSchemas = {
  [IPC.APP.GET_VERSION]: {
    input: AppGetVersionInputSchema,
    output: AppGetVersionOutputSchema
  },
  [IPC.WINDOW.MINIMIZE]: {
    input: WindowMinimizeInputSchema,
    output: WindowMinimizeOutputSchema
  },
  [IPC.WINDOW.MAXIMIZE_TOGGLE]: {
    input: WindowMaximizeToggleInputSchema,
    output: WindowMaximizeToggleOutputSchema
  },
  [IPC.WINDOW.CLOSE]: {
    input: WindowCloseInputSchema,
    output: WindowCloseOutputSchema
  },
  [IPC.WINDOW.IS_MAXIMIZED]: {
    input: WindowIsMaximizedInputSchema,
    output: WindowIsMaximizedOutputSchema
  }
} as const

export type IpcChannel = keyof typeof IpcSchemas
export type IpcInput<C extends IpcChannel> = z.infer<(typeof IpcSchemas)[C]['input']>
export type IpcOutput<C extends IpcChannel> = z.infer<(typeof IpcSchemas)[C]['output']>

/** Fire-and-forget channels pushed from main → renderer (no response). */
export const IpcEventSchemas = {
  [IPC.WINDOW.MAXIMIZE_CHANGED]: WindowMaximizeChangedEventSchema
} as const

export type IpcEventChannel = keyof typeof IpcEventSchemas
export type IpcEventPayload<C extends IpcEventChannel> = z.infer<(typeof IpcEventSchemas)[C]>

type InvokeArgs<C extends IpcChannel> = IpcInput<C> extends undefined ? [] : [input: IpcInput<C>]

export type IpcBridge = {
  invoke: <C extends IpcChannel>(channel: C, ...args: InvokeArgs<C>) => Promise<IpcOutput<C>>
  /** Subscribe to a main → renderer event. Returns an unsubscribe function. */
  on: <C extends IpcEventChannel>(
    channel: C,
    listener: (payload: IpcEventPayload<C>) => void
  ) => () => void
}
