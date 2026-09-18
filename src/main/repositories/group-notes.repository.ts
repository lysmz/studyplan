import { and, desc, eq } from 'drizzle-orm'
import type { GroupNote as GroupNoteDto } from '../../shared/api'
import type { AppDatabase } from '../db'
import { groupNotesTable, usersTable, type GroupNote } from '../db/schema'
import type { GroupDatabaseExecutor } from './group-transaction'

export type NewGroupNote = Pick<
  GroupNote,
  'groupId' | 'title' | 'content' | 'url' | 'type' | 'createdBy'
>
export type GroupNoteChanges = Partial<
  Pick<GroupNote, 'title' | 'content' | 'url' | 'type' | 'updatedBy'>
>

const noteSelection = {
  id: groupNotesTable.id,
  groupId: groupNotesTable.groupId,
  title: groupNotesTable.title,
  content: groupNotesTable.content,
  url: groupNotesTable.url,
  type: groupNotesTable.type,
  createdBy: groupNotesTable.createdBy,
  createdByName: usersTable.displayName,
  createdAt: groupNotesTable.createdAt,
  updatedAt: groupNotesTable.updatedAt
}

export class GroupNotesRepository {
  constructor(private readonly database: AppDatabase) {}

  listByGroupId(groupId: number): Promise<GroupNoteDto[]> {
    return this.database
      .select(noteSelection)
      .from(groupNotesTable)
      .innerJoin(usersTable, eq(usersTable.id, groupNotesTable.createdBy))
      .where(eq(groupNotesTable.groupId, groupId))
      .orderBy(desc(groupNotesTable.updatedAt))
  }

  async findById(
    groupId: number,
    noteId: number,
    executor: GroupDatabaseExecutor = this.database
  ): Promise<GroupNoteDto | undefined> {
    const [note] = await executor
      .select(noteSelection)
      .from(groupNotesTable)
      .innerJoin(usersTable, eq(usersTable.id, groupNotesTable.createdBy))
      .where(and(eq(groupNotesTable.groupId, groupId), eq(groupNotesTable.id, noteId)))
      .limit(1)
    return note
  }

  async create(values: NewGroupNote, executor: GroupDatabaseExecutor): Promise<GroupNote> {
    const [note] = await executor.insert(groupNotesTable).values(values).returning()
    if (!note) throw new Error('The database did not return the created group note.')
    return note
  }

  async update(
    groupId: number,
    noteId: number,
    changes: GroupNoteChanges,
    executor: GroupDatabaseExecutor
  ): Promise<GroupNote | undefined> {
    const [note] = await executor
      .update(groupNotesTable)
      .set(changes)
      .where(and(eq(groupNotesTable.groupId, groupId), eq(groupNotesTable.id, noteId)))
      .returning()
    return note
  }

  async delete(groupId: number, noteId: number): Promise<void> {
    await this.database
      .delete(groupNotesTable)
      .where(and(eq(groupNotesTable.groupId, groupId), eq(groupNotesTable.id, noteId)))
  }
}
