import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db'
import { coursesTable, studyProgramsTable, type Course, type StudyProgram } from '../db/schema'

export class StudyProgramsRepository {
  constructor(private readonly database: AppDatabase) {}

  async listStudyPrograms(): Promise<StudyProgram[]> {
    return this.database.select().from(studyProgramsTable).orderBy(studyProgramsTable.name)
  }

  async listCoursesByStudyProgramId(studyProgramId: number): Promise<Course[]> {
    return this.database
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.studyProgramId, studyProgramId))
      .orderBy(coursesTable.semester, coursesTable.name)
  }
}
