import { and, eq, inArray } from 'drizzle-orm'
import type { GroupTask as GroupTaskDto } from '../../shared/api'
import type { AppDatabase } from '../db'
import { groupCommentsTable, groupTasksTable, usersTable, type GroupTask } from '../db/schema'
import type { GroupDatabaseExecutor } from './group-transaction'

export type NewGroupTask = Pick<
  GroupTask,
  'groupId' | 'title' | 'description' | 'dueDate' | 'assigneeId' | 'createdBy'
>
export type GroupTaskChanges = Partial<
  Pick<GroupTask, 'title' | 'description' | 'dueDate' | 'assigneeId' | 'status' | 'updatedBy'>
>

const taskSelection = {
  id: groupTasksTable.id,
  groupId: groupTasksTable.groupId,
  title: groupTasksTable.title,
  description: groupTasksTable.description,
  dueDate: groupTasksTable.dueDate,
  assigneeId: groupTasksTable.assigneeId,
  status: groupTasksTable.status,
  createdBy: groupTasksTable.createdBy,
  createdByName: usersTable.displayName,
  createdAt: groupTasksTable.createdAt,
  updatedAt: groupTasksTable.updatedAt
}

interface TaskWithoutAssigneeName {
  id: number
  groupId: number
  title: string
  description: string | null
  dueDate: Date | null
  assigneeId: number | null
  status: 'open' | 'done'
  createdBy: number
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export class GroupTasksRepository {
  constructor(private readonly database: AppDatabase) {}

  private async selectOne(
    groupId: number,
    taskId: number,
    executor: GroupDatabaseExecutor
  ): Promise<TaskWithoutAssigneeName | undefined> {
    const [task] = await executor
      .select(taskSelection)
      .from(groupTasksTable)
      .innerJoin(usersTable, eq(usersTable.id, groupTasksTable.createdBy))
      .where(and(eq(groupTasksTable.groupId, groupId), eq(groupTasksTable.id, taskId)))
      .limit(1)
    return task
  }

  private async addAssigneeNames(
    tasks: TaskWithoutAssigneeName[],
    executor: GroupDatabaseExecutor
  ): Promise<GroupTaskDto[]> {
    const assigneeIds = [
      ...new Set(tasks.flatMap(({ assigneeId }) => (assigneeId ? [assigneeId] : [])))
    ]
    const assignees =
      assigneeIds.length === 0
        ? []
        : await executor
            .select({ id: usersTable.id, displayName: usersTable.displayName })
            .from(usersTable)
            .where(inArray(usersTable.id, assigneeIds))
    const names = new Map(assignees.map(({ id, displayName }) => [id, displayName]))
    return tasks.map((task) => ({
      ...task,
      assigneeName: task.assigneeId ? (names.get(task.assigneeId) ?? null) : null
    }))
  }

  async listByGroupId(groupId: number): Promise<GroupTaskDto[]> {
    const tasks = await this.database
      .select(taskSelection)
      .from(groupTasksTable)
      .innerJoin(usersTable, eq(usersTable.id, groupTasksTable.createdBy))
      .where(eq(groupTasksTable.groupId, groupId))
      .orderBy(groupTasksTable.status, groupTasksTable.dueDate)
    return this.addAssigneeNames(tasks, this.database)
  }

  async findById(
    groupId: number,
    taskId: number,
    executor: GroupDatabaseExecutor = this.database
  ): Promise<GroupTaskDto | undefined> {
    const task = await this.selectOne(groupId, taskId, executor)
    if (!task) return undefined
    const [result] = await this.addAssigneeNames([task], executor)
    return result
  }

  async create(values: NewGroupTask, executor: GroupDatabaseExecutor): Promise<GroupTask> {
    const [task] = await executor.insert(groupTasksTable).values(values).returning()
    if (!task) throw new Error('The database did not return the created group task.')
    return task
  }

  async update(
    groupId: number,
    taskId: number,
    changes: GroupTaskChanges,
    executor: GroupDatabaseExecutor
  ): Promise<GroupTask | undefined> {
    const [task] = await executor
      .update(groupTasksTable)
      .set(changes)
      .where(and(eq(groupTasksTable.groupId, groupId), eq(groupTasksTable.id, taskId)))
      .returning()
    return task
  }

  async deleteWithComments(
    groupId: number,
    taskId: number,
    executor: GroupDatabaseExecutor
  ): Promise<void> {
    await executor
      .delete(groupCommentsTable)
      .where(
        and(
          eq(groupCommentsTable.groupId, groupId),
          eq(groupCommentsTable.targetType, 'task'),
          eq(groupCommentsTable.targetId, taskId)
        )
      )
    await executor
      .delete(groupTasksTable)
      .where(and(eq(groupTasksTable.groupId, groupId), eq(groupTasksTable.id, taskId)))
  }
}
