import type { Grade } from '../db/schema'

export function computeGpa(grades: Grade[]): number | null {
  const gradedCourses = grades.filter(
    (grade): grade is Grade & { grade: number } => grade.grade !== null
  )
  if (gradedCourses.length === 0) return null

  const totalEcts = gradedCourses.reduce((sum, grade) => sum + grade.ects, 0)
  if (totalEcts === 0) return null

  const weightedSum = gradedCourses.reduce((sum, grade) => sum + grade.grade * grade.ects, 0)
  return Math.round((weightedSum / totalEcts) * 100) / 100
}

export function computePassedEcts(grades: Grade[]): number {
  return grades.filter((grade) => grade.passed).reduce((sum, grade) => sum + grade.ects, 0)
}
