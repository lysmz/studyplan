import { z } from 'zod'
import { CourseSchema, StudyProgramSchema, type StudyCatalogImportResult } from '../../shared/api'
import type { Course, StudyProgram } from '../db/schema'
import { StudyProgramsRepository } from '../repositories/study-programs.repository'

export const DEFAULT_STUDY_CATALOG_URL =
  'https://repsgcypslupjhdbtcjm.supabase.co/functions/v1/study-catalog'

const catalogSchema = z.object({
  programs: z.array(StudyProgramSchema),
  courses: z.array(CourseSchema.extend({ isRequired: z.boolean().default(true) }))
})

export class StudyProgramsService {
  private refreshInFlight?: Promise<StudyCatalogImportResult>

  constructor(
    private readonly studyPrograms: StudyProgramsRepository,
    private readonly catalogUrl = process.env.STUDY_CATALOG_URL?.trim() ||
      DEFAULT_STUDY_CATALOG_URL,
    private readonly fetchCatalog: typeof fetch = fetch
  ) {}

  refreshStudyCatalog(): Promise<StudyCatalogImportResult> {
    this.refreshInFlight ??= this.fetchAndImportCatalog().finally(() => {
      this.refreshInFlight = undefined
    })
    return this.refreshInFlight
  }

  private async fetchAndImportCatalog(): Promise<StudyCatalogImportResult> {
    const response = await this.fetchCatalog(this.catalogUrl, {
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store'
    })
    if (!response.ok) throw new Error(`Catalog download failed: HTTP ${response.status}`)

    const catalog = catalogSchema.parse(await response.json())
    await this.studyPrograms.importCatalog(catalog.programs, catalog.courses)
    return { programCount: catalog.programs.length, courseCount: catalog.courses.length }
  }

  listStudyPrograms(): Promise<StudyProgram[]> {
    return this.studyPrograms.listStudyPrograms()
  }

  listStudyProgramCourses(studyProgramId: number): Promise<Course[]> {
    return this.studyPrograms.listCoursesByStudyProgramId(studyProgramId)
  }
}
