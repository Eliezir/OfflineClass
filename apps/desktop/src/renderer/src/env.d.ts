/// <reference types="vite/client" />

// Catálogos do Lingui (.po) são importados como módulos pelo @lingui/vite-plugin.
declare module '*.po' {
  import type { Messages } from '@lingui/core'
  export const messages: Messages
}
