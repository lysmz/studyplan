import type { AppDatabase } from '../db'
import { groupActivityLogTable, type GroupActivityType } from '../db/schema'
import type { GroupDatabaseExecutor } from './group-transaction'

export interface NewGroupActivity {
  groupId: number
  actorId: number
  type: GroupActivityType
  description: string
}

export class GroupActivityRepository {
  constructor(private readonly database: AppDatabase) {}

  async record(
    activity: NewGroupActivity,
    executor: GroupDatabaseExecutor = this.database
  ): Promise<void> {
    await executor.insert(groupActivityLogTable).values(activity)
  }
}
