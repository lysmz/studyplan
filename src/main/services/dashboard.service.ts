import type { ActivityItem, DashboardStats } from '../../shared/api'
import type { Event, EventType } from '../db/schema'
import { ActivityLogRepository } from '../repositories/activity-log.repository'
import { EventsRepository } from '../repositories/events.repository'
import { GradesRepository } from '../repositories/grades.repository'
import { computeGpa, computePassedEcts } from './grade-statistics'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const DEADLINE_TYPES: ReadonlySet<EventType> = new Set(['exam', 'deadline', 'registration'])

export type Clock = () => Date

export class DashboardService {
  constructor(
    private readonly grades: GradesRepository,
    private readonly events: EventsRepository,
    private readonly activityLog: ActivityLogRepository,
    private readonly clock: Clock = () => new Date()
  ) {}

  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const { now, inSevenDays } = this.getUpcomingWindow()
    const [grades, upcomingEvents] = await Promise.all([
      this.grades.listForStatsByUserId(userId),
      this.events.listByUserId(userId, {
        startsAtOrAfter: now,
        startsAtOrBefore: inSevenDays
      })
    ])

    return {
      gpa: computeGpa(grades),
      totalEcts: computePassedEcts(grades),
      upcomingDeadlinesCount: upcomingEvents.filter((event) => DEADLINE_TYPES.has(event.type))
        .length,
      gradesCount: grades.length
    }
  }

  getDashboardUpcoming(userId: number): Promise<Event[]> {
    const { now, inSevenDays } = this.getUpcomingWindow()
    return this.events.listByUserId(userId, {
      startsAtOrAfter: now,
      startsAtOrBefore: inSevenDays
    })
  }

  async getDashboardActivity(userId: number): Promise<ActivityItem[]> {
    const activity = await this.activityLog.listRecentByUserId(userId, 10)
    return activity.map(({ id, type, description, createdAt }) => ({
      id,
      type,
      description,
      createdAt
    }))
  }

  private getUpcomingWindow(): { now: Date; inSevenDays: Date } {
    const now = this.clock()
    return { now, inSevenDays: new Date(now.getTime() + SEVEN_DAYS_MS) }
  }
}
