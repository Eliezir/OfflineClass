import { asset } from '@/lib/asset'
import { cn } from '@/lib/utils'

/**
 * Theme-aware brand mark: logo.png on the light theme, logo-dark.png on the
 * dark theme — swapped purely with the `dark` variant so it tracks the
 * selected theme with no JS.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-block', className)}>
      <img
        src={asset('assets/logo.png')}
        alt="Apresenta.AI"
        className="block size-full dark:hidden"
      />
      <img
        src={asset('assets/logo-dark.png')}
        alt="Apresenta.AI"
        className="hidden size-full dark:block"
      />
    </span>
  )
}
