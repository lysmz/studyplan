import type { IpcMainInvokeEvent } from 'electron'

export const MAX_ICAL_FILE_SIZE_BYTES = 10 * 1024 * 1024

export type IcalFileSelection = { status: 'cancelled' } | { status: 'selected'; contents: string }

export interface IcalFilePicker {
  selectIcalFile(event: IpcMainInvokeEvent): Promise<IcalFileSelection>
}

export class InvalidIcalFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidIcalFileError'
  }
}
