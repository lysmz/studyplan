import type { IpcMainInvokeEvent } from 'electron'

export const MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024

export type CsvFileSelection = { status: 'cancelled' } | { status: 'selected'; contents: string }

export interface CsvFilePicker {
  selectCsvFile(event: IpcMainInvokeEvent): Promise<CsvFileSelection>
}

export class InvalidCsvFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCsvFileError'
  }
}
