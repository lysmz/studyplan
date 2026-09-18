import type { Comment, CommentInput } from '../../shared/api'
import { GroupCommentsRepository } from '../repositories/group-comments.repository'
import { GroupEventsRepository } from '../repositories/group-events.repository'
import { GroupTasksRepository } from '../repositories/group-tasks.repository'
import type { CommentTargetType } from '../db/schema'
import { GroupAccessService } from './group-access.service'
import { GroupEventNotFoundError } from './group-events.service'
import { GroupTaskNotFoundError } from './group-tasks.service'

export class GroupCommentNotFoundError extends Error {
  constructor() {
    super('Group comment not found.')
    this.name = 'GroupCommentNotFoundError'
  }
}

export class CommentDeleteForbiddenError extends Error {
  constructor() {
    super('Only the comment author or group owner may delete this comment.')
    this.name = 'CommentDeleteForbiddenError'
  }
}

export class GroupCommentsService {
  constructor(
    private readonly access: GroupAccessService,
    private readonly events: GroupEventsRepository,
    private readonly tasks: GroupTasksRepository,
    private readonly comments: GroupCommentsRepository
  ) {}

  private async requireTarget(
    groupId: number,
    targetType: CommentTargetType,
    targetId: number
  ): Promise<void> {
    const target =
      targetType === 'event'
        ? await this.events.findById(groupId, targetId)
        : await this.tasks.findById(groupId, targetId)
    if (!target) {
      if (targetType === 'event') throw new GroupEventNotFoundError()
      throw new GroupTaskNotFoundError()
    }
  }

  async listComments(
    userId: number,
    groupId: number,
    targetType: CommentTargetType,
    targetId: number
  ): Promise<Comment[]> {
    await this.access.requireMember(groupId, userId)
    await this.requireTarget(groupId, targetType, targetId)
    return this.comments.list(groupId, targetType, targetId)
  }

  async addComment(
    userId: number,
    groupId: number,
    targetType: CommentTargetType,
    targetId: number,
    input: CommentInput
  ): Promise<Comment> {
    await this.access.requireMember(groupId, userId)
    await this.requireTarget(groupId, targetType, targetId)
    return this.comments.create({
      groupId,
      targetType,
      targetId,
      content: input.content,
      createdBy: userId
    })
  }

  async deleteComment(userId: number, commentId: number): Promise<undefined> {
    const comment = await this.comments.findById(commentId)
    if (!comment) throw new GroupCommentNotFoundError()
    const membership = await this.access.requireMember(comment.groupId, userId)
    if (comment.createdBy !== userId && membership.role !== 'owner') {
      throw new CommentDeleteForbiddenError()
    }
    await this.comments.delete(commentId)
    return undefined
  }
}
