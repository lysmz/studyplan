import type { ApiClient } from '../shared/api'

declare global {
  interface Window {
    api: ApiClient
    appInfo: {
      versions: {
        electron: string
        chrome: string
        node: string
      }
    }
  }
}
