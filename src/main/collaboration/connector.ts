import { UpdateType, type PowerSyncBackendConnector, type PowerSyncDatabase } from '@powersync/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface CollaborationRemoteConfig {
  powerSyncEndpoint: string
  supabaseUrl: string
  supabasePublishableKey: string
  email: string
  password: string
}

export interface CollaborationConnection {
  connector: SupabaseCollaborationConnector
  supabase: SupabaseClient
}

export class SupabaseCollaborationConnector implements PowerSyncBackendConnector {
  private static readonly writableTables = new Set(['group_tasks'])

  constructor(
    private readonly powerSyncEndpoint: string,
    private readonly supabase: SupabaseClient
  ) {}

  static async signIn(config: CollaborationRemoteConfig): Promise<CollaborationConnection> {
    const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    const { error } = await supabase.auth.signInWithPassword({
      email: config.email,
      password: config.password
    })
    if (error) throw new Error(`Supabase collaboration sign-in failed: ${error.message}`)
    return {
      connector: new SupabaseCollaborationConnector(config.powerSyncEndpoint, supabase),
      supabase
    }
  }

  async fetchCredentials(): Promise<{ endpoint: string; token: string } | null> {
    const { data, error } = await this.supabase.auth.getSession()
    if (error) throw new Error(`Could not refresh Supabase session: ${error.message}`)
    if (!data.session) return null
    return { endpoint: this.powerSyncEndpoint, token: data.session.access_token }
  }

  async uploadData(database: PowerSyncDatabase): Promise<void> {
    const batch = await database.getCrudBatch(100)
    if (!batch) return

    for (const entry of batch.crud) {
      if (!SupabaseCollaborationConnector.writableTables.has(entry.table)) {
        throw new Error(
          `Local writes to ${entry.table} are not allowed; use the authenticated collaboration RPC.`
        )
      }

      let error: { message: string } | null = null
      if (entry.op === UpdateType.PUT) {
        const response = await this.supabase.from('group_tasks').upsert({
          id: entry.id,
          ...(entry.opData ?? {})
        })
        error = response.error
      } else if (entry.op === UpdateType.PATCH) {
        const response = await this.supabase
          .from('group_tasks')
          .update(entry.opData ?? {})
          .eq('id', entry.id)
        error = response.error
      } else if (entry.op === UpdateType.DELETE) {
        const response = await this.supabase.from('group_tasks').delete().eq('id', entry.id)
        error = response.error
      }

      if (error) {
        throw new Error(`Supabase rejected ${entry.op} group task ${entry.id}: ${error.message}`)
      }
    }

    await batch.complete()
  }

  async getUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser()
    if (error || !data.user) {
      throw new Error(`Could not resolve the Supabase user: ${error?.message ?? 'no user'}`)
    }
    return data.user.id
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut({ scope: 'local' })
  }
}
