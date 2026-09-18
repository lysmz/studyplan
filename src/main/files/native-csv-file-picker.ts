import { readFile, stat } from 'node:fs/promises'
import { extname } from 'node:path'
import { BrowserWindow, dialog, type OpenDialogOptions } from 'electron'
import {
  InvalidCsvFileError,
  MAX_CSV_FILE_SIZE_BYTES,
  type CsvFilePicker,
  type CsvFileSelection
} from './csv-file-picker'

const dialogOptions: OpenDialogOptions = {
  title: 'Noten aus CSV importieren',
  buttonLabel: 'Importieren',
  filters: [{ name: 'CSV-Dateien', extensions: ['csv'] }],
  properties: ['openFile']
}

export class NativeCsvFilePicker implements CsvFilePicker {
  async selectCsvFile(event: Electron.IpcMainInvokeEvent): Promise<CsvFileSelection> {
    const owner = BrowserWindow.fromWebContents(event.sender)
    const result = owner
      ? await dialog.showOpenDialog(owner, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) return { status: 'cancelled' }

    const [filePath] = result.filePaths
    if (extname(filePath).toLowerCase() !== '.csv') {
      throw new InvalidCsvFileError('Bitte wähle eine CSV-Datei aus.')
    }

    const metadata = await stat(filePath)
    if (!metadata.isFile()) throw new InvalidCsvFileError('Die Auswahl ist keine Datei.')
    if (metadata.size > MAX_CSV_FILE_SIZE_BYTES) {
      throw new InvalidCsvFileError('Die CSV-Datei darf höchstens 5 MB groß sein.')
    }

    const buffer = await readFile(filePath)
    if (buffer.byteLength > MAX_CSV_FILE_SIZE_BYTES) {
      throw new InvalidCsvFileError('Die CSV-Datei darf höchstens 5 MB groß sein.')
    }

    return {
      status: 'selected',
      contents: buffer.toString('utf8').replace(/^\uFEFF/, '')
    }
  }
}
