import type { GroupRole } from '../db/schema'
import { GroupsRepository } from '../repositories/groups.repository'

export class GroupMemberRequiredError extends Error {
  constructor() {
    super('Group membership is required.')
    this.name = 'GroupMemberRequiredError'
  }
}

export class GroupAccessService {
  constructor(private readonly groups: GroupsRepository) {}

  async requireMember(groupId: number, userId: number): Promise<{ role: GroupRole }> {
    const membership = await this.groups.findMembership(groupId, userId)
    if (!membership) throw new GroupMemberRequiredError()
    return membership
  }

  async isMember(groupId: number, userId: number): Promise<boolean> {
    return Boolean(await this.groups.findMembership(groupId, userId))
  }
}
