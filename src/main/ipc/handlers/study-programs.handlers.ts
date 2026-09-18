import { SessionService } from '../../auth/session.service'
import { StudyProgramsService } from '../../services/study-programs.service'
import { definePartialApiHandlers, type PartialApiHandlerRegistry } from '../api-dispatcher'
import { authenticated } from '../authenticated'

export function createStudyProgramsHandlers(
  studyProgramsService: StudyProgramsService,
  sessionService: SessionService
): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    listStudyPrograms() {
      return studyProgramsService.listStudyPrograms()
    },

    listStudyProgramCourses: authenticated<'listStudyProgramCourses'>(sessionService, ({ path }) =>
      studyProgramsService.listStudyProgramCourses(path.id)
    )
  })
}
