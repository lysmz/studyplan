import type { GroupNote, GroupNoteInput, GroupNoteUpdate } from '../../shared/api'
import { GroupActivityRepository } from '../repositories/group-activity.repository'
import { GroupNotesRepository, type GroupNoteChanges } from '../repositories/group-notes.repository'
import { GroupUnitOfWork } from '../repositories/group-transaction'
import { GroupAccessService } from './group-access.service'

export class GroupNoteNotFoundError extends Error {
  constructor() {
    super('Group note not found.')
    this.name = 'GroupNoteNotFoundError'
  }
}

export class GroupNotesService {
  constructor(
    private readonly access: GroupAccessService,
    private readonly notes: GroupNotesRepository,
    private readonly activity: GroupActivityRepository,
    private readonly unitOfWork: GroupUnitOfWork
  ) {}

  async listNotes(userId: number, groupId: number): Promise<GroupNote[]> {
    await this.access.requireMember(groupId, userId)
    return this.notes.listByGroupId(groupId)
  }

  async createNote(userId: number, groupId: number, input: GroupNoteInput): Promise<GroupNote> {
    await this.access.requireMember(groupId, userId)
    return this.unitOfWork.run(async (transaction) => {
      const created = await this.notes.create(
        {
          groupId,
          title: input.title,
          content: input.content ?? null,
          url: input.url ?? null,
          type: input.type,
          createdBy: userId
        },
        transaction
      )
      await this.activity.record(
        {
          groupId,
          actorId: userId,
          type: 'note_created',
          description: `Notiz „${created.title}“ wurde erstellt`
        },
        transaction
      )
      const result = await this.notes.findById(groupId, created.id, transaction)
      if (!result) throw new Error('The created group note could not be read back.')
      return result
    })
  }

  async updateNote(
    userId: number,
    groupId: number,
    noteId: number,
    input: GroupNoteUpdate
  ): Promise<GroupNote> {
    await this.access.requireMember(groupId, userId)
    if (!(await this.notes.findById(groupId, noteId))) throw new GroupNoteNotFoundError()
    const changes: GroupNoteChanges = { ...input, updatedBy: userId }
    return this.unitOfWork.run(async (transaction) => {
      const updated = await this.notes.update(groupId, noteId, changes, transaction)
      if (!updated) throw new GroupNoteNotFoundError()
      const result = await this.notes.findById(groupId, noteId, transaction)
      if (!result) throw new GroupNoteNotFoundError()
      return result
    })
  }

  async deleteNote(userId: number, groupId: number, noteId: number): Promise<undefined> {
    await this.access.requireMember(groupId, userId)
    if (!(await this.notes.findById(groupId, noteId))) throw new GroupNoteNotFoundError()
    await this.notes.delete(groupId, noteId)
    return undefined
  }
}
