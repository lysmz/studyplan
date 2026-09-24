import type {
  CollaborationOperation,
  CollaborationOperations
} from '../../../shared/collaboration/ipc'

export class CollaborationClientError extends Error {
  constructor(
    readonly code: 'INVALID' | 'UNAUTHENTICATED' | 'OFFLINE' | 'FORBIDDEN' | 'FAILED',
    message: string
  ) {
    super(message)
    this.name = 'CollaborationClientError'
  }
}

export async function collaboration<K extends CollaborationOperation>(
  operation: K,
  input: CollaborationOperations[K]['input']
): Promise<CollaborationOperations[K]['output']> {
  const result = await window.collaborationTransport.invoke(operation, input)
  if (!result.ok) throw new CollaborationClientError(result.error.code, result.error.message)
  return result.data
}
