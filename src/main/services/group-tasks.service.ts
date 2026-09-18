import type { GroupTask, GroupTaskInput, GroupTaskUpdate } from '../../shared/api'
import { GroupActivityRepository } from '../repositories/group-activity.repository'
import { GroupTasksRepository, type GroupTaskChanges } from '../repositories/group-tasks.repository'
import { GroupUnitOfWork } from '../repositories/group-transaction'
import { GroupAccessService } from './group-access.service'

export class GroupTaskNotFoundError extends Error {
  constructor() {
    super('Group task not found.')
    this.name = 'GroupTaskNotFoundError'
  }
}

export class InvalidTaskAssigneeError extends Error {
  constructor() {
    super('The task assignee must be a member of the group.')
    this.name = 'InvalidTaskAssigneeError'
  }
}

export class GroupTasksService {
  constructor(
    private readonly access: GroupAccessService,
    private readonly tasks: GroupTasksRepository,
    private readonly activity: GroupActivityRepository,
    private readonly unitOfWork: GroupUnitOfWork
  ) {}

  private async validateAssignee(
    groupId: number,
    assigneeId: number | null | undefined
  ): Promise<void> {
    if (assigneeId !== undefined && assigneeId !== null) {
      if (!(await this.access.isMember(groupId, assigneeId))) throw new InvalidTaskAssigneeError()
    }
  }

  async listTasks(userId: number, groupId: number): Promise<GroupTask[]> {
    await this.access.requireMember(groupId, userId)
    return this.tasks.listByGroupId(groupId)
  }

  async createTask(userId: number, groupId: number, input: GroupTaskInput): Promise<GroupTask> {
    await this.access.requireMember(groupId, userId)
    await this.validateAssignee(groupId, input.assigneeId)
    return this.unitOfWork.run(async (transaction) => {
      const created = await this.tasks.create(
        {
          groupId,
          title: input.title,
          description: input.description ?? null,
          dueDate: input.dueDate ?? null,
          assigneeId: input.assigneeId ?? null,
          createdBy: userId
        },
        transaction
      )
      await this.activity.record(
        {
          groupId,
          actorId: userId,
          type: 'task_created',
          description: `Aufgabe „${created.title}“ wurde erstellt`
        },
        transaction
      )
      const result = await this.tasks.findById(groupId, created.id, transaction)
      if (!result) throw new Error('The created group task could not be read back.')
      return result
    })
  }

  async updateTask(
    userId: number,
    groupId: number,
    taskId: number,
    input: GroupTaskUpdate
  ): Promise<GroupTask> {
    await this.access.requireMember(groupId, userId)
    const existing = await this.tasks.findById(groupId, taskId)
    if (!existing) throw new GroupTaskNotFoundError()
    await this.validateAssignee(groupId, input.assigneeId)

    const changes: GroupTaskChanges = { ...input, updatedBy: userId }
    return this.unitOfWork.run(async (transaction) => {
      const updated = await this.tasks.update(groupId, taskId, changes, transaction)
      if (!updated) throw new GroupTaskNotFoundError()
      const type =
        existing.status !== 'done' && updated.status === 'done' ? 'task_completed' : 'task_updated'
      await this.activity.record(
        {
          groupId,
          actorId: userId,
          type,
          description: `Aufgabe „${updated.title}“ wurde aktualisiert`
        },
        transaction
      )
      const result = await this.tasks.findById(groupId, taskId, transaction)
      if (!result) throw new GroupTaskNotFoundError()
      return result
    })
  }

  async deleteTask(userId: number, groupId: number, taskId: number): Promise<undefined> {
    await this.access.requireMember(groupId, userId)
    const existing = await this.tasks.findById(groupId, taskId)
    if (!existing) throw new GroupTaskNotFoundError()
    await this.unitOfWork.run(async (transaction) => {
      await this.tasks.deleteWithComments(groupId, taskId, transaction)
      await this.activity.record(
        {
          groupId,
          actorId: userId,
          type: 'task_updated',
          description: `Aufgabe „${existing.title}“ wurde gelöscht`
        },
        transaction
      )
    })
    return undefined
  }
}
