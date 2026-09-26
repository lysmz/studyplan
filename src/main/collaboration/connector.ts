import type { PowerSyncBackendConnector, PowerSyncDatabase } from '@powersync/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { uploadTaskTransaction, type UploadFailureStore } from './upload'
import { LocalUploadFailureStore } from './upload-failures'

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
  constructor(
    private readonly powerSyncEndpoint: string,
    private readonly supabase: SupabaseClient,
    private readonly options: { userId?: string; failureStore?: UploadFailureStore } = {}
  ) {}

  static async signIn(config: CollaborationRemoteConfig): Promise<CollaborationConnection> {
    const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    const { data, error } = await supabase.auth.signInWithPassword({
      email: config.email,
      password: config.password
    })
    if (error || !data.user)
      throw new Error(`Supabase collaboration sign-in failed: ${error?.message ?? 'no user'}`)
    return {
      connector: new SupabaseCollaborationConnector(config.powerSyncEndpoint, supabase, {
        userId: data.user.id
      }),
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
    const userId = this.options.userId ?? (await this.getUserId())
    await uploadTaskTransaction(
      database,
      this.supabase,
      userId,
      this.options.failureStore ?? new LocalUploadFailureStore(database, userId)
    )
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
