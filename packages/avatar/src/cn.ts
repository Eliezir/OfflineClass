/** Minimal className joiner — drops falsy values and joins with spaces. The
    builder never produces conflicting Tailwind utilities for the same property,
    so a clsx/tailwind-merge dependency isn't needed here. */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ')
}
