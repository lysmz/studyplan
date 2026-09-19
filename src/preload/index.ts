import { contextBridge, ipcRenderer } from 'electron'
import { API_INVOKE_CHANNEL, type ApiTransport } from '../shared/api/ipc'

const transport: ApiTransport = async (operationId, input) =>
  ipcRenderer.invoke(API_INVOKE_CHANNEL, {
    operationId,
    input,
    requestId: globalThis.crypto.randomUUID()
  })

const apiTransport = { invoke: transport }

try {
  contextBridge.exposeInMainWorld('apiTransport', apiTransport)
} catch (error) {
  console.error(error)
}
