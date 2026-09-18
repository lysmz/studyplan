import type { GradeInput, GradeStats, GradeUpdate } from '../../shared/api'
import type { Grade } from '../db/schema'
import { ActivityLogRepository } from '../repositories/activity-log.repository'
import { GradesRepository, type GradeChanges } from '../repositories/grades.repository'

export class GradeNotFoundError extends Error {
  constructor() {
    super('Grade not found.')
    this.name = 'GradeNotFoundError'
  }
}

function computeGpa(grades: Grade[]): number | null {
  const gradedCourses = grades.filter(
    (grade): grade is Grade & { grade: number } => grade.grade !== null
  )
  if (gradedCourses.length === 0) return null

  const totalEcts = gradedCourses.reduce((sum, grade) => sum + grade.ects, 0)
  if (totalEcts === 0) return null

  const weightedSum = gradedCourses.reduce((sum, grade) => sum + grade.grade * grade.ects, 0)
  return Math.round((weightedSum / totalEcts) * 100) / 100
}

export class GradesService {
  constructor(
    private readonly grades: GradesRepository,
    private readonly activityLog: ActivityLogRepository
  ) {}

  listGrades(userId: number, semester?: string): Promise<Grade[]> {
    return this.grades.listByUserId(userId, semester)
  }

  async createGrade(userId: number, input: GradeInput): Promise<Grade> {
    const grade = await this.grades.createGrade({
      courseName: input.courseName,
      grade: input.grade ?? null,
      ects: input.ects,
      semester: input.semester,
      passed: input.passed,
      notes: input.notes ?? null,
      userId,
      courseId: input.courseId ?? null
    })

    await this.activityLog.createActivity({
      type: 'grade_added',
      description: `Note für "${grade.courseName}" hinzugefügt${grade.grade !== null ? `: ${grade.grade}` : ''}`,
      userId
    })

    return grade
  }

  async updateGrade(userId: number, gradeId: number, input: GradeUpdate): Promise<Grade> {
    const changes: GradeChanges = {}
    if (input.courseName !== undefined) changes.courseName = input.courseName
    if (input.grade !== undefined) changes.grade = input.grade
    if (input.ects !== undefined) changes.ects = input.ects
    if (input.semester !== undefined) changes.semester = input.semester
    if (input.passed !== undefined) changes.passed = input.passed
    if (input.notes !== undefined) changes.notes = input.notes
    if (input.courseId !== undefined) changes.courseId = input.courseId

    const grade = await this.grades.updateByIdAndUserId(gradeId, userId, changes)
    if (!grade) throw new GradeNotFoundError()

    await this.activityLog.createActivity({
      type: 'grade_updated',
      description: `Note für "${grade.courseName}" aktualisiert`,
      userId
    })

    return grade
  }

  async deleteGrade(userId: number, gradeId: number): Promise<undefined> {
    const grade = await this.grades.deleteByIdAndUserId(gradeId, userId)
    if (!grade) throw new GradeNotFoundError()
    return undefined
  }

  async getGradeStats(userId: number): Promise<GradeStats> {
    const grades = await this.grades.listForStatsByUserId(userId)
    const semesters = new Map<string, Grade[]>()

    for (const grade of grades) {
      const semesterGrades = semesters.get(grade.semester) ?? []
      semesterGrades.push(grade)
      semesters.set(grade.semester, semesterGrades)
    }

    return {
      overallGpa: computeGpa(grades),
      totalEcts: grades.filter((grade) => grade.passed).reduce((sum, grade) => sum + grade.ects, 0),
      bySemester: Array.from(semesters, ([semester, semesterGrades]) => ({
        semester,
        gpa: computeGpa(semesterGrades),
        ects: semesterGrades
          .filter((grade) => grade.passed)
          .reduce((sum, grade) => sum + grade.ects, 0),
        count: semesterGrades.length
      }))
    }
  }
}
