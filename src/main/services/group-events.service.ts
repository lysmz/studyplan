import type { GroupEvent, GroupEventInput, GroupEventUpdate } from '../../shared/api'
import { GroupActivityRepository } from '../repositories/group-activity.repository'
import {
  GroupEventsRepository,
  type GroupEventChanges
} from '../repositories/group-events.repository'
import { GroupUnitOfWork } from '../repositories/group-transaction'
import { GroupAccessService } from './group-access.service'

export class GroupEventNotFoundError extends Error {
  constructor() {
    super('Group event not found.')
    this.name = 'GroupEventNotFoundError'
  }
}

export class GroupEventsService {
  constructor(
    private readonly access: GroupAccessService,
    private readonly events: GroupEventsRepository,
    private readonly activity: GroupActivityRepository,
    private readonly unitOfWork: GroupUnitOfWork
  ) {}

  async listEvents(userId: number, groupId: number): Promise<GroupEvent[]> {
    await this.access.requireMember(groupId, userId)
    return this.events.listByGroupId(groupId)
  }

  async createEvent(userId: number, groupId: number, input: GroupEventInput): Promise<GroupEvent> {
    await this.access.requireMember(groupId, userId)
    return this.unitOfWork.run(async (transaction) => {
      const created = await this.events.create(
        {
          groupId,
          title: input.title,
          description: input.description ?? null,
          startDate: input.startDate,
          endDate: input.endDate,
          type: input.type,
          location: input.location ?? null,
          createdBy: userId
        },
        transaction
      )
      await this.activity.record(
        {
          groupId,
          actorId: userId,
          type: 'event_created',
          description: `Termin „${created.title}“ wurde erstellt`
        },
        transaction
      )
      const result = await this.events.findById(groupId, created.id, transaction)
      if (!result) throw new Error('The created group event could not be read back.')
      return result
    })
  }

  async updateEvent(
    userId: number,
    groupId: number,
    eventId: number,
    input: GroupEventUpdate
  ): Promise<GroupEvent> {
    await this.access.requireMember(groupId, userId)
    if (!(await this.events.findById(groupId, eventId))) throw new GroupEventNotFoundError()

    const changes: GroupEventChanges = { ...input, updatedBy: userId }
    return this.unitOfWork.run(async (transaction) => {
      const updated = await this.events.update(groupId, eventId, changes, transaction)
      if (!updated) throw new GroupEventNotFoundError()
      await this.activity.record(
        {
          groupId,
          actorId: userId,
          type: 'event_updated',
          description: `Termin „${updated.title}“ wurde aktualisiert`
        },
        transaction
      )
      const result = await this.events.findById(groupId, eventId, transaction)
      if (!result) throw new GroupEventNotFoundError()
      return result
    })
  }

  async deleteEvent(userId: number, groupId: number, eventId: number): Promise<undefined> {
    await this.access.requireMember(groupId, userId)
    const existing = await this.events.findById(groupId, eventId)
    if (!existing) throw new GroupEventNotFoundError()

    await this.unitOfWork.run(async (transaction) => {
      await this.events.deleteWithComments(groupId, eventId, transaction)
      await this.activity.record(
        {
          groupId,
          actorId: userId,
          type: 'event_deleted',
          description: `Termin „${existing.title}“ wurde gelöscht`
        },
        transaction
      )
    })
    return undefined
  }
}
