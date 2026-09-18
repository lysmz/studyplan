import { and, eq } from 'drizzle-orm'
import type { Comment as CommentDto } from '../../shared/api'
import type { AppDatabase } from '../db'
import {
  groupCommentsTable,
  usersTable,
  type CommentTargetType,
  type GroupComment
} from '../db/schema'

export type NewGroupComment = Pick<
  GroupComment,
  'groupId' | 'targetType' | 'targetId' | 'content' | 'createdBy'
>

const commentSelection = {
  id: groupCommentsTable.id,
  targetType: groupCommentsTable.targetType,
  targetId: groupCommentsTable.targetId,
  content: groupCommentsTable.content,
  createdBy: groupCommentsTable.createdBy,
  createdByName: usersTable.displayName,
  createdAt: groupCommentsTable.createdAt
}

export class GroupCommentsRepository {
  constructor(private readonly database: AppDatabase) {}

  list(groupId: number, targetType: CommentTargetType, targetId: number): Promise<CommentDto[]> {
    return this.database
      .select(commentSelection)
      .from(groupCommentsTable)
      .innerJoin(usersTable, eq(usersTable.id, groupCommentsTable.createdBy))
      .where(
        and(
          eq(groupCommentsTable.groupId, groupId),
          eq(groupCommentsTable.targetType, targetType),
          eq(groupCommentsTable.targetId, targetId)
        )
      )
      .orderBy(groupCommentsTable.createdAt)
  }

  async create(values: NewGroupComment): Promise<CommentDto> {
    const [comment] = await this.database.insert(groupCommentsTable).values(values).returning()
    if (!comment) throw new Error('The database did not return the created group comment.')
    const [author] = await this.database
      .select({ displayName: usersTable.displayName })
      .from(usersTable)
      .where(eq(usersTable.id, values.createdBy))
      .limit(1)
    if (!author) throw new Error('The group comment author does not exist.')
    return { ...comment, createdByName: author.displayName }
  }

  async findById(id: number): Promise<GroupComment | undefined> {
    const [comment] = await this.database
      .select()
      .from(groupCommentsTable)
      .where(eq(groupCommentsTable.id, id))
      .limit(1)
    return comment
  }

  async delete(id: number): Promise<void> {
    await this.database.delete(groupCommentsTable).where(eq(groupCommentsTable.id, id))
  }
}
