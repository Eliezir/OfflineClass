import { useState } from 'react'
import { Bell } from 'lucide-react'
import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'
import { Trans, useLingui } from '@lingui/react/macro'
import { Segmented, type SegmentedOption } from '@renderer/shared/ui/segmented'
import { Switch } from '@renderer/shared/ui/switch'
import { cn } from '@renderer/shared/utils'
import { notify } from '@renderer/shared/services/toast'
import { useNotificationSettings } from '../hooks/use-notification-settings'
import { TOAST_TONES, type ToastTone } from '../toast-tones'
import { SettingsSection } from './settings-section'
import { ToastPositionPicker } from './toast-position-picker'

type DurationValue = '3' | '5' | '10'

const DURATION_OPTIONS: (Omit<SegmentedOption<DurationValue>, 'label'> & {
  label: MessageDescriptor
})[] = [
  { value: '3', label: msg`3 s` },
  { value: '5', label: msg`5 s` },
  { value: '10', label: msg`10 s` }
]

/** Test-only toast content per tone. These are explicit examples — they never
    reach the notification history, they just preview how each tone looks. */
const TEST_TOASTS: Record<ToastTone, { title: MessageDescriptor; description: MessageDescriptor }> =
  {
    success: {
      title: msg`Toast de teste — sucesso`,
      description: msg`Exemplo de como um aviso de sucesso aparece.`
    },
    info: {
      title: msg`Toast de teste — informação`,
      description: msg`Exemplo de como um aviso informativo aparece.`
    },
    warning: {
      title: msg`Toast de teste — aviso`,
      description: msg`Exemplo de como um aviso de atenção aparece.`
    },
    error: {
      title: msg`Toast de teste — erro`,
      description: msg`Exemplo de como um aviso de erro aparece.`
    }
  }

export function NotificationsSection(): React.JSX.Element {
  const { i18n, t } = useLingui()
  const notifications = useNotificationSettings()
  // Each test bumps the signal (to replay the entrance) and sets the tone shown.
  const [test, setTest] = useState<{ tone: ToastTone; n: number } | null>(null)

  const fireTest = (tone: ToastTone): void => {
    // Replay the in-picker preview and fire a real toast at the chosen position.
    setTest((prev) => ({ tone, n: (prev?.n ?? 0) + 1 }))
    const sample = TEST_TOASTS[tone]
    notify.tone(tone, i18n._(sample.title), { description: i18n._(sample.description) })
  }

  return (
    <SettingsSection
      icon={Bell}
      title={t`Notificações`}
      description={t`Como os avisos (toasts) aparecem no aplicativo.`}
    >
      <div className="grid gap-x-8 gap-y-6 p-5 @3xl:grid-cols-[minmax(0,18rem)_minmax(0,17rem)_minmax(0,1fr)]">
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">
            <Trans>Posição</Trans>
          </div>
          <ToastPositionPicker
            value={notifications.position}
            onChange={notifications.setPosition}
            replaySignal={test?.n ?? 0}
            tone={test?.tone}
          />
        </div>

        <div className="space-y-6 @3xl:pt-8">
          <FormRow
            title={t`Som`}
            description={t`Toca um som ao aparecer.`}
            control={
              <Switch
                checked={notifications.sound}
                onCheckedChange={notifications.setSound}
                aria-label={t`Som ao aparecer`}
              />
            }
          />
          <FormRow
            title={t`Dispensar automaticamente`}
            description={t`Fecha o toast sozinho após a duração.`}
            control={
              <Switch
                checked={notifications.autoDismiss}
                onCheckedChange={notifications.setAutoDismiss}
                aria-label={t`Dispensar automaticamente`}
              />
            }
          />
          <div
            className={cn(
              'space-y-2',
              !notifications.autoDismiss && 'pointer-events-none opacity-50'
            )}
          >
            <div className="text-sm font-medium text-foreground">
              <Trans>Duração</Trans>
            </div>
            <Segmented
              ariaLabel={t`Duração do toast`}
              fullWidth
              disabled={!notifications.autoDismiss}
              options={DURATION_OPTIONS.map((o) => ({ ...o, label: i18n._(o.label) }))}
              value={String(notifications.duration) as DurationValue}
              onChange={(v) => notifications.setDuration(Number(v))}
            />
          </div>
        </div>

        <div className="space-y-3 @3xl:border-l @3xl:border-border/60 @3xl:pl-8">
          <div>
            <div className="text-sm font-medium text-foreground">
              <Trans>Testar notificação</Trans>
            </div>
            <p className="mt-0.5 text-xs text-pretty text-muted-foreground">
              <Trans>Dispare um toast de exemplo para conferir suas preferências.</Trans>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {TOAST_TONES.map((tone) => {
              const Icon = tone.icon
              return (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => fireTest(tone.id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-border bg-card p-2.5 text-left',
                    'outline-none transition-colors duration-150',
                    'hover:bg-foreground/[0.03] focus-visible:ring-[3px] focus-visible:ring-ring/25'
                  )}
                >
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-md"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${tone.accent}, transparent 86%)`,
                      color: tone.accent
                    }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{i18n._(tone.label)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}

/** A form row: label + description on the left, control aligned on the right. */
function FormRow({
  title,
  description,
  control
}: {
  title: string
  description: string
  control: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}
