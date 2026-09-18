import { eq } from 'drizzle-orm'
import type { AppDatabase } from '../db'
import { usersTable, type InsertUser, type User } from '../db/schema'

export type SafeUser = Pick<User, 'id' | 'username' | 'displayName' | 'studyProgramId'>

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    studyProgramId: user.studyProgramId
  }
}

export class UsersRepository {
  constructor(private readonly database: AppDatabase) {}

  async findById(id: number): Promise<User | undefined> {
    const [user] = await this.database
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1)
    return user
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.database
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1)
    return user
  }

  async createUser(values: InsertUser): Promise<User> {
    const [user] = await this.database.insert(usersTable).values(values).returning()
    if (!user) throw new Error('The database did not return the created user.')
    return user
  }
}
