import type { z } from 'zod'
import { IPC } from './channels'
import { AppGetVersionInputSchema, AppGetVersionOutputSchema } from './app'

export const IpcSchemas = {
  [IPC.APP.GET_VERSION]: {
    input: AppGetVersionInputSchema,
    output: AppGetVersionOutputSchema
  }
} as const

export type IpcChannel = keyof typeof IpcSchemas
export type IpcInput<C extends IpcChannel> = z.infer<(typeof IpcSchemas)[C]['input']>
export type IpcOutput<C extends IpcChannel> = z.infer<(typeof IpcSchemas)[C]['output']>

type InvokeArgs<C extends IpcChannel> = IpcInput<C> extends undefined ? [] : [input: IpcInput<C>]

export type IpcBridge = {
  invoke: <C extends IpcChannel>(channel: C, ...args: InvokeArgs<C>) => Promise<IpcOutput<C>>
}
