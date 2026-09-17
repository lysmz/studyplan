import { randomUUID } from 'node:crypto'
import { contextBridge, ipcRenderer } from 'electron'
import { API_INVOKE_CHANNEL, createApiClient, type ApiTransport } from '../shared/api'

const transport: ApiTransport = async (operationId, input) =>
  ipcRenderer.invoke(API_INVOKE_CHANNEL, {
    operationId,
    input,
    requestId: randomUUID()
  })

const api = createApiClient(transport)
const appInfo = {
  versions: {
    electron: process.versions.electron ?? 'unknown',
    chrome: process.versions.chrome ?? 'unknown',
    node: process.versions.node
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('appInfo', appInfo)
  } catch (error) {
    console.error(error)
  }
} else {
  Object.assign(window, { api, appInfo })
}
