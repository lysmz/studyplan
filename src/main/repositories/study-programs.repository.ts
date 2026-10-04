import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db'
import { coursesTable, studyProgramsTable, type Course, type StudyProgram } from '../db/schema'

export class StudyProgramsRepository {
  constructor(private readonly database: AppDatabase) {}

  async importCatalog(programs: StudyProgram[], courses: Course[]): Promise<void> {
    await this.database.transaction(async (transaction) => {
      for (const program of programs) {
        const { id, ...changes } = program
        await transaction
          .insert(studyProgramsTable)
          .values({ id, ...changes })
          .onConflictDoUpdate({ target: studyProgramsTable.id, set: changes })
      }

      for (const course of courses) {
        const { id, ...changes } = course
        await transaction
          .insert(coursesTable)
          .values({ id, ...changes })
          .onConflictDoUpdate({ target: coursesTable.id, set: changes })
      }
    })
  }

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
