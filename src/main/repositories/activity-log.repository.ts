import { desc, eq } from 'drizzle-orm'
import type { AppDatabase } from '../db'
import { activityLogTable, type ActivityLog, type InsertActivityLog } from '../db/schema'

export class ActivityLogRepository {
  constructor(private readonly database: AppDatabase) {}

  async createActivity(values: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await this.database.insert(activityLogTable).values(values).returning()
    if (!activity) throw new Error('The database did not return the created activity.')
    return activity
  }

  async listRecentByUserId(userId: number, limit: number): Promise<ActivityLog[]> {
    return this.database
      .select()
      .from(activityLogTable)
      .where(eq(activityLogTable.userId, userId))
      .orderBy(desc(activityLogTable.createdAt), desc(activityLogTable.id))
      .limit(limit)
  }
}
