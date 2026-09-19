import { contextBridge, ipcRenderer } from 'electron'
import { API_INVOKE_CHANNEL, type ApiTransport } from '../shared/api/ipc'

const transport: ApiTransport = async (operationId, input) =>
  ipcRenderer.invoke(API_INVOKE_CHANNEL, {
    operationId,
    input,
    requestId: globalThis.crypto.randomUUID()
  })

const apiTransport = { invoke: transport }
const appInfo = {
  versions: {
    electron: process.versions.electron ?? 'unknown',
    chrome: process.versions.chrome ?? 'unknown',
    node: process.versions.node
  }
}

try {
  contextBridge.exposeInMainWorld('apiTransport', apiTransport)
  contextBridge.exposeInMainWorld('appInfo', appInfo)
} catch (error) {
  console.error(error)
}
