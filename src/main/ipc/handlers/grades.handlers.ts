import { SessionService } from '../../auth/session.service'
import { GradeNotFoundError, GradesService } from '../../services/grades.service'
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
  sessionService: SessionService
): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    listGrades: authenticated<'listGrades'>(sessionService, ({ query }, userId) =>
      gradesService.listGrades(userId, query?.semester)
    ),

    createGrade: authenticated<'createGrade'>(sessionService, ({ body }, userId) =>
      gradesService.createGrade(userId, body)
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
