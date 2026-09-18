import { and, desc, eq } from 'drizzle-orm'
import type { AppDatabase } from '../db'
import { gradesTable, type Grade, type InsertGrade } from '../db/schema'

export type GradeChanges = Partial<Omit<InsertGrade, 'userId'>>

export class GradesRepository {
  constructor(private readonly database: AppDatabase) {}

  async listByUserId(userId: number, semester?: string): Promise<Grade[]> {
    const condition = semester
      ? and(eq(gradesTable.userId, userId), eq(gradesTable.semester, semester))
      : eq(gradesTable.userId, userId)

    return this.database
      .select()
      .from(gradesTable)
      .where(condition)
      .orderBy(desc(gradesTable.createdAt))
  }

  async listForStatsByUserId(userId: number): Promise<Grade[]> {
    return this.database.select().from(gradesTable).where(eq(gradesTable.userId, userId))
  }

  async createGrade(values: InsertGrade): Promise<Grade> {
    const [grade] = await this.database.insert(gradesTable).values(values).returning()
    if (!grade) throw new Error('The database did not return the created grade.')
    return grade
  }

  async findByIdAndUserId(gradeId: number, userId: number): Promise<Grade | undefined> {
    const [grade] = await this.database
      .select()
      .from(gradesTable)
      .where(and(eq(gradesTable.id, gradeId), eq(gradesTable.userId, userId)))
      .limit(1)
    return grade
  }

  async updateByIdAndUserId(
    gradeId: number,
    userId: number,
    changes: GradeChanges
  ): Promise<Grade | undefined> {
    if (Object.keys(changes).length === 0) return this.findByIdAndUserId(gradeId, userId)

    const [grade] = await this.database
      .update(gradesTable)
      .set(changes)
      .where(and(eq(gradesTable.id, gradeId), eq(gradesTable.userId, userId)))
      .returning()
    return grade
  }

  async deleteByIdAndUserId(gradeId: number, userId: number): Promise<Grade | undefined> {
    const [grade] = await this.database
      .delete(gradesTable)
      .where(and(eq(gradesTable.id, gradeId), eq(gradesTable.userId, userId)))
      .returning()
    return grade
  }
}
