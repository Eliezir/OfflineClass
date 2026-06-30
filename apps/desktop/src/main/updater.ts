import { app, dialog, type BrowserWindow } from 'electron'
// electron-updater is a pure CommonJS module (`module.exports = { autoUpdater }`,
// no `default`). After electron-vite bundles it as an external, the default
// export is undefined — so import the named binding directly.
import { autoUpdater } from 'electron-updater'

/**
 * Wire up GitHub-based auto-update for the teacher app.
 *
 * Offline-first: the check fires once shortly after launch and every failure
 * (no network — the normal classroom case) is swallowed. When an update is
 * downloaded the user is asked whether to restart now or later. The update
 * feed comes from the `publish: github` block baked into `app-update.yml` by
 * electron-builder, so there's nothing to configure here.
 */
export function initAutoUpdater(getWindow: () => BrowserWindow | null): void {
  // Only meaningful in packaged builds — in dev there's no app-update.yml and
  // electron-updater throws.
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-downloaded', (info) => {
    const options = {
      type: 'info' as const,
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1,
      title: 'Atualização disponível',
      message: `A versão ${info.version} do OfflineClass foi baixada.`,
      detail: 'Reinicie o aplicativo para concluir a instalação.'
    }
    const onChoice = (response: number): void => {
      if (response === 0) autoUpdater.quitAndInstall()
    }
    const win = getWindow()
    const prompt =
      win && !win.isDestroyed() ? dialog.showMessageBox(win, options) : dialog.showMessageBox(options)
    void prompt.then((result) => onChoice(result.response))
  })

  // Being offline is expected — log, never interrupt the teacher.
  autoUpdater.on('error', (err) => {
    console.warn('[updater] verificação de atualização falhou:', err?.message ?? err)
  })

  void autoUpdater.checkForUpdates().catch((err) => {
    console.warn('[updater] checkForUpdates:', err?.message ?? err)
  })
}
