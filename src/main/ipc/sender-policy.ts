import type { IpcMainInvokeEvent, WebContents } from 'electron'

export interface MutableApiSenderPolicy {
  allow(webContents: WebContents, isUrlAllowed: (url: string) => boolean): void
  isAllowed(event: IpcMainInvokeEvent): boolean
}

export function createWindowSenderPolicy(): MutableApiSenderPolicy {
  const allowedWindows = new Map<
    number,
    { window: WebContents; isUrlAllowed: (url: string) => boolean }
  >()
  return {
    allow(webContents, isUrlAllowed) {
      allowedWindows.set(webContents.id, { window: webContents, isUrlAllowed })
      webContents.once('destroyed', () => allowedWindows.delete(webContents.id))
    },
    isAllowed(event) {
      const senderFrame = event.senderFrame
      if (!senderFrame) return false
      const allowed = allowedWindows.get(event.sender.id)
      return (
        allowed?.window === event.sender &&
        senderFrame === event.sender.mainFrame &&
        allowed.isUrlAllowed(senderFrame.url)
      )
    }
  }
}
