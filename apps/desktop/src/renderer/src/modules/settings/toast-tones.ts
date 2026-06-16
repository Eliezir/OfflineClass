import { CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

/** The toast variants the user can fire a sample of. Shared by the test buttons
    and the position-picker preview so the icon + color stay in sync. */
export const TOAST_TONES: {
  id: ToastTone
  label: MessageDescriptor
  icon: LucideIcon
  className: string
  accent: string
}[] = [
  {
    id: 'success',
    label: msg`Sucesso`,
    icon: CircleCheck,
    className: 'text-success',
    accent: 'var(--success)'
  },
  {
    id: 'info',
    label: msg`Informação`,
    icon: Info,
    className: 'text-primary',
    accent: 'var(--primary)'
  },
  {
    id: 'warning',
    label: msg`Aviso`,
    icon: TriangleAlert,
    className: 'text-warning',
    accent: 'var(--warning)'
  },
  {
    id: 'error',
    label: msg`Erro`,
    icon: CircleX,
    className: 'text-destructive',
    accent: 'var(--destructive)'
  }
]
