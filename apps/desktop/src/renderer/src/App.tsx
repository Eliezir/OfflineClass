import { Button } from '@/components/ui/button'
import Versions from './components/Versions'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">OfflineClass — Desktop</h1>
      <p className="text-muted-foreground text-sm">
        Electron + electron-vite scaffold, Tailwind v4, shadcn (Nova).
      </p>
      <Button onClick={ipcHandle}>Send IPC ping</Button>
      <Versions />
    </div>
  )
}

export default App
