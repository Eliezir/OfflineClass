import { ipcMain } from 'electron'
import { IpcSchemas, type IpcChannel, type IpcInput, type IpcOutput } from '@shared/ipc/contract'

type Handler<C extends IpcChannel> = (input: IpcInput<C>) => Promise<IpcOutput<C>> | IpcOutput<C>

export function registerHandler<C extends IpcChannel>(channel: C, handler: Handler<C>): void {
  ipcMain.handle(channel, async (_event, raw: unknown) => {
    const input = IpcSchemas[channel].input.parse(raw) as IpcInput<C>
    return handler(input)
  })
}
