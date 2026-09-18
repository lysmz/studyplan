import type { StudyGroup, StudyGroupInput, StudyGroupUpdate } from '../../shared/api'
import { GroupsRepository, type GroupChanges } from '../repositories/groups.repository'

export class GroupNotFoundError extends Error {
  constructor() {
    super('Study group not found.')
    this.name = 'GroupNotFoundError'
  }
}

export class GroupOwnerRequiredError extends Error {
  constructor() {
    super('Only the group owner may update this study group.')
    this.name = 'GroupOwnerRequiredError'
  }
}

export class GroupsService {
  constructor(private readonly groups: GroupsRepository) {}

  listGroups(userId: number): Promise<StudyGroup[]> {
    return this.groups.listForMember(userId)
  }

  createGroup(userId: number, input: StudyGroupInput): Promise<StudyGroup> {
    return this.groups.createWithOwner(
      {
        name: input.name,
        description: input.description ?? null,
        createdBy: userId
      },
      userId
    )
  }

  async getGroup(userId: number, groupId: number): Promise<StudyGroup> {
    const group = await this.groups.findSummaryForMember(groupId, userId)
    if (!group) throw new GroupNotFoundError()
    return group
  }

  async updateGroup(userId: number, groupId: number, input: StudyGroupUpdate): Promise<StudyGroup> {
    const existing = await this.groups.findSummaryForMember(groupId, userId)
    if (!existing) throw new GroupNotFoundError()
    if (existing.myRole !== 'owner') throw new GroupOwnerRequiredError()

    const changes: GroupChanges = {}
    if (input.name !== undefined) changes.name = input.name
    if (input.description !== undefined) changes.description = input.description
    if (Object.keys(changes).length === 0) return existing

    const updated = await this.groups.updateById(groupId, changes)
    if (!updated) throw new GroupNotFoundError()
    return { ...existing, ...updated }
  }
}
