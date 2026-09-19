import type { ApiTransport } from '../shared/api/ipc'

declare global {
  interface Window {
    apiTransport: {
      invoke: ApiTransport
    }
  }
}
