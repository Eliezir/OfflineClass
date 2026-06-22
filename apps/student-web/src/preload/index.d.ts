import type { StudentApi } from './index'

declare global {
  interface Window {
    api: StudentApi
  }
}
