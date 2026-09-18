import type { Course, StudyProgram } from '../db/schema'
import { StudyProgramsRepository } from '../repositories/study-programs.repository'

export class StudyProgramsService {
  constructor(private readonly studyPrograms: StudyProgramsRepository) {}

  listStudyPrograms(): Promise<StudyProgram[]> {
    return this.studyPrograms.listStudyPrograms()
  }

  listStudyProgramCourses(studyProgramId: number): Promise<Course[]> {
    return this.studyPrograms.listCoursesByStudyProgramId(studyProgramId)
  }
}
