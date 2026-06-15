import { FlaskConical } from 'lucide-react'
import type { ProviderId } from '@renderer/shared/services/ai-providers'
import { ClaudeMark } from './claude-mark'

type ProviderGlyph = React.ComponentType<{ className?: string; style?: React.CSSProperties }>

/** Per-provider iconography + accent, shared by the switch and the focal orb so
    selecting an option lights up one coherent color story (icon → glow → pill). */
export const PROVIDER_VISUALS: Record<
  ProviderId,
  { Icon: ProviderGlyph; accent: string; glow: string; ring: string }
> = {
  'claude-code': {
    Icon: ClaudeMark,
    // Brand violet — same hue as the hero glow. (Swap to Claude coral if we want
    // the SDK to read in Anthropic's brand color rather than the app's.)
    accent: 'oklch(0.55 0.22 295)',
    glow: 'oklch(0.55 0.24 295 / 0.55)',
    ring: 'oklch(0.55 0.22 295 / 0.35)'
  },
  mock: {
    Icon: FlaskConical,
    // Calmer sky tone so the "experiment" mode reads as neutral, not success.
    accent: 'oklch(0.62 0.13 230)',
    glow: 'oklch(0.65 0.15 230 / 0.45)',
    ring: 'oklch(0.62 0.13 230 / 0.32)'
  }
}
