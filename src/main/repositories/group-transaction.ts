import type { AppDatabase } from '../db'

export type GroupTransaction = Parameters<Parameters<AppDatabase['transaction']>[0]>[0]
export type GroupDatabaseExecutor = AppDatabase | GroupTransaction

export class GroupUnitOfWork {
  constructor(private readonly database: AppDatabase) {}

  run<T>(work: (transaction: GroupTransaction) => Promise<T>): Promise<T> {
    return this.database.transaction(work)
  }
}
