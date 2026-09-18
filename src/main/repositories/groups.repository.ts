import { and, count, desc, eq, inArray } from 'drizzle-orm'
import type { StudyGroup as StudyGroupSummary } from '../../shared/api'
import type { AppDatabase } from '../db'
import { groupMembersTable, studyGroupsTable, type GroupRole, type StudyGroup } from '../db/schema'

export type GroupChanges = Partial<Pick<StudyGroup, 'name' | 'description'>>

export class GroupsRepository {
  constructor(private readonly database: AppDatabase) {}

  async listForMember(userId: number): Promise<StudyGroupSummary[]> {
    const groups = await this.database
      .select({
        id: studyGroupsTable.id,
        name: studyGroupsTable.name,
        description: studyGroupsTable.description,
        createdBy: studyGroupsTable.createdBy,
        createdAt: studyGroupsTable.createdAt,
        myRole: groupMembersTable.role,
        inviteToken: studyGroupsTable.inviteToken
      })
      .from(groupMembersTable)
      .innerJoin(studyGroupsTable, eq(studyGroupsTable.id, groupMembersTable.groupId))
      .where(eq(groupMembersTable.userId, userId))
      .orderBy(desc(studyGroupsTable.createdAt))

    if (groups.length === 0) return []

    const memberCounts = await this.database
      .select({
        groupId: groupMembersTable.groupId,
        memberCount: count(groupMembersTable.id)
      })
      .from(groupMembersTable)
      .where(
        inArray(
          groupMembersTable.groupId,
          groups.map(({ id }) => id)
        )
      )
      .groupBy(groupMembersTable.groupId)

    const countByGroupId = new Map(
      memberCounts.map(({ groupId, memberCount }) => [groupId, memberCount])
    )
    return groups.map((group) => ({
      ...group,
      memberCount: countByGroupId.get(group.id) ?? 0
    }))
  }

  async findSummaryForMember(
    groupId: number,
    userId: number
  ): Promise<StudyGroupSummary | undefined> {
    const [group] = await this.database
      .select({
        id: studyGroupsTable.id,
        name: studyGroupsTable.name,
        description: studyGroupsTable.description,
        createdBy: studyGroupsTable.createdBy,
        createdAt: studyGroupsTable.createdAt,
        myRole: groupMembersTable.role,
        inviteToken: studyGroupsTable.inviteToken
      })
      .from(groupMembersTable)
      .innerJoin(studyGroupsTable, eq(studyGroupsTable.id, groupMembersTable.groupId))
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, userId)))
      .limit(1)

    if (!group) return undefined

    const [members] = await this.database
      .select({ memberCount: count(groupMembersTable.id) })
      .from(groupMembersTable)
      .where(eq(groupMembersTable.groupId, groupId))

    return { ...group, memberCount: members?.memberCount ?? 0 }
  }

  async findMembership(groupId: number, userId: number): Promise<{ role: GroupRole } | undefined> {
    const [membership] = await this.database
      .select({ role: groupMembersTable.role })
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, userId)))
      .limit(1)
    return membership
  }

  async createWithOwner(
    values: Pick<StudyGroup, 'name' | 'description' | 'createdBy'>,
    ownerId: number
  ): Promise<StudyGroupSummary> {
    return this.database.transaction(async (transaction) => {
      const [group] = await transaction.insert(studyGroupsTable).values(values).returning()
      if (!group) throw new Error('The database did not return the created study group.')

      await transaction.insert(groupMembersTable).values({
        groupId: group.id,
        userId: ownerId,
        role: 'owner'
      })

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        createdBy: group.createdBy,
        createdAt: group.createdAt,
        myRole: 'owner',
        memberCount: 1,
        inviteToken: group.inviteToken
      }
    })
  }

  async updateById(groupId: number, changes: GroupChanges): Promise<StudyGroup | undefined> {
    const [group] = await this.database
      .update(studyGroupsTable)
      .set(changes)
      .where(eq(studyGroupsTable.id, groupId))
      .returning()
    return group
  }
}
