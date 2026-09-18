import type { AppDatabase } from '../db'
import { activityLogTable, type ActivityLog, type InsertActivityLog } from '../db/schema'

export class ActivityLogRepository {
  constructor(private readonly database: AppDatabase) {}

  async createActivity(values: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await this.database.insert(activityLogTable).values(values).returning()
    if (!activity) throw new Error('The database did not return the created activity.')
    return activity
  }
}
