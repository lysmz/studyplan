export interface ParsedGradeCsvRow {
  courseName: string
  grade: number | null
  ects: number
  semester: string
  passed: boolean
}

export interface ParsedGradeCsv {
  rows: ParsedGradeCsvRow[]
  skippedCount: number
}

export const MAX_GRADE_CSV_ROWS = 1000

export class InvalidGradesCsvError extends Error {
  constructor(message = 'Die CSV-Datei enthält keine gültigen Noten.') {
    super(message)
    this.name = 'InvalidGradesCsvError'
  }
}

function delimiterCount(line: string, delimiter: ',' | ';'): number {
  let count = 0
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') index += 1
      else quoted = !quoted
    } else if (!quoted && character === delimiter) {
      count += 1
    }
  }
  return count
}

function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  return delimiterCount(firstLine, ';') > delimiterCount(firstLine, ',') ? ';' : ','
}

function parseRecords(text: string, delimiter: ',' | ';'): string[][] {
  const records: string[][] = []
  let record: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (!quoted && character === delimiter) {
      record.push(cell.trim())
      cell = ''
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      record.push(cell.trim())
      records.push(record)
      record = []
      cell = ''
    } else {
      cell += character
    }
  }

  if (quoted)
    throw new InvalidGradesCsvError(
      'Die CSV-Datei enthält ein nicht geschlossenes Anführungszeichen.'
    )
  if (cell.length > 0 || record.length > 0) {
    record.push(cell.trim())
    records.push(record)
  }
  return records
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number.parseFloat(value.trim().replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function parseGradesCsv(rawText: string): ParsedGradeCsv {
  const text = rawText.replace(/^\uFEFF/, '').trim()
  if (!text) throw new InvalidGradesCsvError()

  const records = parseRecords(text, detectDelimiter(text))
  if (records.length < 2) throw new InvalidGradesCsvError()
  if (records.length - 1 > MAX_GRADE_CSV_ROWS) {
    throw new InvalidGradesCsvError(
      `Die CSV-Datei darf höchstens ${MAX_GRADE_CSV_ROWS} Datenzeilen enthalten.`
    )
  }

  const header = records[0].map((value) => value.trim().toLowerCase())
  const findColumn = (...names: string[]): number => {
    for (const name of names) {
      const index = header.findIndex((value) => value.includes(name))
      if (index >= 0) return index
    }
    return -1
  }

  const nameColumn = findColumn('kurs', 'modul', 'fach', 'course', 'name', 'bezeichnung')
  const gradeColumn = findColumn('note', 'grade', 'bewertung')
  const ectsColumn = findColumn('ects', 'punkte', 'credits', 'cp')
  const semesterColumn = findColumn('semester', 'term')
  const rows: ParsedGradeCsvRow[] = []
  let skippedCount = 0

  for (const cells of records.slice(1)) {
    if (cells.every((value) => value.trim() === '')) continue
    if (cells.length < 2) {
      skippedCount += 1
      continue
    }

    const courseName = (nameColumn >= 0 ? cells[nameColumn] : cells[0])?.trim()
    if (!courseName) {
      skippedCount += 1
      continue
    }

    const grade = parseNumber(gradeColumn >= 0 ? cells[gradeColumn] : undefined)
    const parsedEcts = parseNumber(ectsColumn >= 0 ? cells[ectsColumn] : undefined)
    const ects = parsedEcts && parsedEcts > 0 ? parsedEcts : 3
    const semester =
      semesterColumn >= 0 && cells[semesterColumn]?.trim()
        ? cells[semesterColumn].trim()
        : 'Unbekannt'

    rows.push({
      courseName,
      grade,
      ects,
      semester,
      passed: grade === null || grade <= 4
    })
  }

  if (rows.length === 0) throw new InvalidGradesCsvError()
  return { rows, skippedCount }
}
