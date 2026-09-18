import { and, eq } from 'drizzle-orm'
import type { GroupEvent as GroupEventDto } from '../../shared/api'
import type { AppDatabase } from '../db'
import { groupCommentsTable, groupEventsTable, usersTable, type GroupEvent } from '../db/schema'
import type { GroupDatabaseExecutor } from './group-transaction'

export type NewGroupEvent = Pick<
  GroupEvent,
  'groupId' | 'title' | 'description' | 'startDate' | 'endDate' | 'type' | 'location' | 'createdBy'
>
export type GroupEventChanges = Partial<
  Pick<
    GroupEvent,
    'title' | 'description' | 'startDate' | 'endDate' | 'type' | 'location' | 'updatedBy'
  >
>

const eventSelection = {
  id: groupEventsTable.id,
  groupId: groupEventsTable.groupId,
  title: groupEventsTable.title,
  description: groupEventsTable.description,
  startDate: groupEventsTable.startDate,
  endDate: groupEventsTable.endDate,
  type: groupEventsTable.type,
  location: groupEventsTable.location,
  createdBy: groupEventsTable.createdBy,
  createdByName: usersTable.displayName,
  createdAt: groupEventsTable.createdAt,
  updatedAt: groupEventsTable.updatedAt
}

export class GroupEventsRepository {
  constructor(private readonly database: AppDatabase) {}

  listByGroupId(groupId: number): Promise<GroupEventDto[]> {
    return this.database
      .select(eventSelection)
      .from(groupEventsTable)
      .innerJoin(usersTable, eq(usersTable.id, groupEventsTable.createdBy))
      .where(eq(groupEventsTable.groupId, groupId))
      .orderBy(groupEventsTable.startDate)
  }

  async findById(
    groupId: number,
    eventId: number,
    executor: GroupDatabaseExecutor = this.database
  ): Promise<GroupEventDto | undefined> {
    const [event] = await executor
      .select(eventSelection)
      .from(groupEventsTable)
      .innerJoin(usersTable, eq(usersTable.id, groupEventsTable.createdBy))
      .where(and(eq(groupEventsTable.groupId, groupId), eq(groupEventsTable.id, eventId)))
      .limit(1)
    return event
  }

  async create(values: NewGroupEvent, executor: GroupDatabaseExecutor): Promise<GroupEvent> {
    const [event] = await executor.insert(groupEventsTable).values(values).returning()
    if (!event) throw new Error('The database did not return the created group event.')
    return event
  }

  async update(
    groupId: number,
    eventId: number,
    changes: GroupEventChanges,
    executor: GroupDatabaseExecutor
  ): Promise<GroupEvent | undefined> {
    const [event] = await executor
      .update(groupEventsTable)
      .set(changes)
      .where(and(eq(groupEventsTable.groupId, groupId), eq(groupEventsTable.id, eventId)))
      .returning()
    return event
  }

  async deleteWithComments(
    groupId: number,
    eventId: number,
    executor: GroupDatabaseExecutor
  ): Promise<void> {
    await executor
      .delete(groupCommentsTable)
      .where(
        and(
          eq(groupCommentsTable.groupId, groupId),
          eq(groupCommentsTable.targetType, 'event'),
          eq(groupCommentsTable.targetId, eventId)
        )
      )
    await executor
      .delete(groupEventsTable)
      .where(and(eq(groupEventsTable.groupId, groupId), eq(groupEventsTable.id, eventId)))
  }
}
