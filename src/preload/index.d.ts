import type { ApiTransport } from '../shared/api/ipc'
import type { CollaborationTransport } from '../shared/collaboration/ipc'

declare global {
  interface Window {
    apiTransport: {
      invoke: ApiTransport
    }
    collaborationTransport: {
      invoke: CollaborationTransport
    }
  }
}
