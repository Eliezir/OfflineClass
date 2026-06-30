import { Cloud, Loader2, RefreshCw, Unlink } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { SettingRow, SettingsSection } from '@renderer/modules/settings/components/settings-section'
import { Button } from '@renderer/shared/ui/button'
import { Switch } from '@renderer/shared/ui/switch'
import {
  useSyncStatus,
  useEnableSync,
  useDisableSync,
  useTriggerSync,
  useUnlinkAccount
} from '../queries'
import { SyncLinkDialog } from './sync-link-dialog'

function SyncStatusDot({ state }: { state: string }): React.JSX.Element {
  const colorClass =
    state === 'idle'
      ? 'bg-success'
      : state === 'syncing'
        ? 'bg-primary animate-pulse'
        : state === 'error'
          ? 'bg-destructive'
          : 'bg-muted-foreground'

  return <span className={`inline-block size-2 rounded-full ${colorClass}`} />
}

export function SyncSection(): React.JSX.Element {
  const { t } = useLingui()
  const { data: status, isLoading } = useSyncStatus()
  const { mutate: enableSync, isPending: isEnabling } = useEnableSync()
  const { mutate: disableSync, isPending: isDisabling } = useDisableSync()
  const { mutate: triggerSync, isPending: isSyncing } = useTriggerSync()
  const { mutate: unlinkAccount, isPending: isUnlinking } = useUnlinkAccount()

  const togglePending = isEnabling || isDisabling

  return (
    <SettingsSection
      icon={Cloud}
      title={t`Sincronização com nuvem`}
      description={t`Backup de provas e resultados num servidor PowerSync da sua instituição.`}
    >
      {/* Conta cloud */}
      <SettingRow
        title={<Trans>Conta cloud</Trans>}
        description={
          status?.linked ? (
            <Trans>Conta vinculada. Sync é opcional — fique local se preferir.</Trans>
          ) : (
            <Trans>
              Nenhuma conta vinculada. Seus dados ficam somente neste computador.
            </Trans>
          )
        }
        control={
          isLoading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : status?.linked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unlinkAccount()}
              disabled={isUnlinking}
            >
              {isUnlinking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Unlink className="size-4" />
              )}
              <Trans>Desvincular</Trans>
            </Button>
          ) : (
            <SyncLinkDialog
              trigger={
                <Button size="sm">
                  <Cloud className="size-4" />
                  <Trans>Vincular conta</Trans>
                </Button>
              }
            />
          )
        }
      />

      {/* Toggle sync ativo — só visível quando a conta está vinculada */}
      {status?.linked && (
        <SettingRow
          title={<Trans>Sync ativo</Trans>}
          description={
            status.enabled ? (
              <span className="flex items-center gap-1.5">
                <SyncStatusDot state={status.state} />
                {status.state === 'idle'
                  ? t`Sincronizado`
                  : status.state === 'syncing'
                    ? t`Sincronizando…`
                    : status.state === 'error'
                      ? t`Erro de sincronização`
                      : t`Conectando…`}
              </span>
            ) : (
              <Trans>Desabilitado — dados ficam somente neste computador.</Trans>
            )
          }
          control={
            <Switch
              checked={status.enabled}
              disabled={togglePending}
              onCheckedChange={(checked) => {
                if (checked) enableSync()
                else disableSync()
              }}
            />
          }
        />
      )}

      {/* Sincronizar agora — só quando sync está ativo */}
      {status?.linked && status.enabled && (
        <SettingRow
          title={<Trans>Sincronizar agora</Trans>}
          description={<Trans>Envia provas e resultados locais para a nuvem imediatamente.</Trans>}
          control={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => triggerSync()}
              disabled={isSyncing || status.state === 'syncing'}
            >
              {isSyncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              <Trans>Sincronizar</Trans>
            </Button>
          }
        />
      )}
    </SettingsSection>
  )
}
