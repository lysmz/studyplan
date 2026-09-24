import { contextBridge, ipcRenderer } from 'electron'
import { API_INVOKE_CHANNEL, type ApiTransport } from '../shared/api/ipc'
import {
  COLLABORATION_INVOKE_CHANNEL,
  type CollaborationTransport
} from '../shared/collaboration/ipc'

const transport: ApiTransport = async (operationId, input) =>
  ipcRenderer.invoke(API_INVOKE_CHANNEL, {
    operationId,
    input,
    requestId: globalThis.crypto.randomUUID()
  })

const apiTransport = { invoke: transport }
const collaborationTransport: { invoke: CollaborationTransport } = {
  invoke: (operation, input) =>
    ipcRenderer.invoke(COLLABORATION_INVOKE_CHANNEL, { operation, input })
}

try {
  contextBridge.exposeInMainWorld('apiTransport', apiTransport)
  contextBridge.exposeInMainWorld('collaborationTransport', collaborationTransport)
} catch (error) {
  console.error(error)
}
