import { readFile, stat } from 'node:fs/promises'
import { extname } from 'node:path'
import { BrowserWindow, dialog, type OpenDialogOptions } from 'electron'
import {
  InvalidIcalFileError,
  MAX_ICAL_FILE_SIZE_BYTES,
  type IcalFilePicker,
  type IcalFileSelection
} from './ical-file-picker'

const dialogOptions: OpenDialogOptions = {
  title: 'Termine aus ICS importieren',
  buttonLabel: 'Importieren',
  filters: [{ name: 'iCalendar-Dateien', extensions: ['ics'] }],
  properties: ['openFile']
}

export class NativeIcalFilePicker implements IcalFilePicker {
  async selectIcalFile(event: Electron.IpcMainInvokeEvent): Promise<IcalFileSelection> {
    const owner = BrowserWindow.fromWebContents(event.sender)
    const result = owner
      ? await dialog.showOpenDialog(owner, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) return { status: 'cancelled' }

    const [filePath] = result.filePaths
    if (extname(filePath).toLowerCase() !== '.ics') {
      throw new InvalidIcalFileError('Bitte wähle eine ICS-Datei aus.')
    }

    const metadata = await stat(filePath)
    if (!metadata.isFile()) throw new InvalidIcalFileError('Die Auswahl ist keine Datei.')
    if (metadata.size > MAX_ICAL_FILE_SIZE_BYTES) {
      throw new InvalidIcalFileError('Die ICS-Datei darf höchstens 10 MB groß sein.')
    }

    const buffer = await readFile(filePath)
    if (buffer.byteLength > MAX_ICAL_FILE_SIZE_BYTES) {
      throw new InvalidIcalFileError('Die ICS-Datei darf höchstens 10 MB groß sein.')
    }

    return {
      status: 'selected',
      contents: buffer.toString('utf8').replace(/^\uFEFF/, '')
    }
  }
}
