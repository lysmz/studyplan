import { SessionService } from '../../auth/session.service'
import { InvalidCsvFileError, type CsvFilePicker } from '../../files/csv-file-picker'
import {
  GradeNotFoundError,
  GradesService,
  InvalidGradesCsvError
} from '../../services/grades.service'
import {
  ApiDeclaredResponseError,
  definePartialApiHandlers,
  type PartialApiHandlerRegistry
} from '../api-dispatcher'
import { authenticated } from '../authenticated'

function notFound(
  operationId: 'updateGrade' | 'deleteGrade'
): ApiDeclaredResponseError<typeof operationId> {
  return new ApiDeclaredResponseError(
    operationId,
    { status: 404, body: { error: 'Note nicht gefunden' } },
    'NOT_FOUND',
    'Grade not found.'
  )
}

export function createGradesHandlers(
  gradesService: GradesService,
  sessionService: SessionService,
  csvFilePicker: CsvFilePicker
): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    listGrades: authenticated<'listGrades'>(sessionService, ({ query }, userId) =>
      gradesService.listGrades(userId, query?.semester)
    ),

    createGrade: authenticated<'createGrade'>(sessionService, ({ body }, userId) =>
      gradesService.createGrade(userId, body)
    ),

    importGradesCsv: authenticated<'importGradesCsv'>(
      sessionService,
      async (_input, userId, context) => {
        try {
          const selection = await csvFilePicker.selectCsvFile(context.event)
          if (selection.status === 'cancelled') {
            return { status: 'cancelled', importedCount: 0, skippedCount: 0 }
          }
          return await gradesService.importGradesCsv(userId, selection.contents)
        } catch (error) {
          if (error instanceof InvalidCsvFileError || error instanceof InvalidGradesCsvError) {
            throw new ApiDeclaredResponseError(
              'importGradesCsv',
              { status: 400, body: { error: error.message } },
              'VALIDATION_ERROR',
              error.message
            )
          }
          throw error
        }
      }
    ),

    getGradeStats: authenticated<'getGradeStats'>(sessionService, (_input, userId) =>
      gradesService.getGradeStats(userId)
    ),

    updateGrade: authenticated<'updateGrade'>(sessionService, async ({ path, body }, userId) => {
      try {
        return await gradesService.updateGrade(userId, path.id, body)
      } catch (error) {
        if (error instanceof GradeNotFoundError) throw notFound('updateGrade')
        throw error
      }
    }),

    deleteGrade: authenticated<'deleteGrade'>(sessionService, async ({ path }, userId) => {
      try {
        return await gradesService.deleteGrade(userId, path.id)
      } catch (error) {
        if (error instanceof GradeNotFoundError) throw notFound('deleteGrade')
        throw error
      }
    })
  })
}
