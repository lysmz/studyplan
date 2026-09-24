import { UpdateType, type PowerSyncBackendConnector, type PowerSyncDatabase } from '@powersync/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface PowerSyncSpikeRemoteConfig {
  powerSyncEndpoint: string
  supabaseUrl: string
  supabaseAnonKey: string
  email: string
  password: string
}

function requireNonEmpty(value: string | undefined, name: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${name} is required for the online PowerSync spike.`)
  return normalized
}

export function readPowerSyncSpikeRemoteConfig(
  environment: NodeJS.ProcessEnv = process.env
): PowerSyncSpikeRemoteConfig | null {
  const values = [
    environment.POWERSYNC_SPIKE_ENDPOINT,
    environment.SUPABASE_URL,
    environment.SUPABASE_PUBLISHABLE_KEY ?? environment.SUPABASE_ANON_KEY,
    environment.POWERSYNC_SPIKE_EMAIL,
    environment.POWERSYNC_SPIKE_PASSWORD
  ]
  if (values.every((value) => !value?.trim())) return null

  return {
    powerSyncEndpoint: requireNonEmpty(
      environment.POWERSYNC_SPIKE_ENDPOINT,
      'POWERSYNC_SPIKE_ENDPOINT'
    ),
    supabaseUrl: requireNonEmpty(environment.SUPABASE_URL, 'SUPABASE_URL'),
    supabaseAnonKey: requireNonEmpty(
      environment.SUPABASE_PUBLISHABLE_KEY ?? environment.SUPABASE_ANON_KEY,
      'SUPABASE_PUBLISHABLE_KEY (or legacy SUPABASE_ANON_KEY)'
    ),
    email: requireNonEmpty(environment.POWERSYNC_SPIKE_EMAIL, 'POWERSYNC_SPIKE_EMAIL'),
    password: requireNonEmpty(environment.POWERSYNC_SPIKE_PASSWORD, 'POWERSYNC_SPIKE_PASSWORD')
  }
}

export class SupabasePowerSyncSpikeConnector implements PowerSyncBackendConnector {
  private static readonly uploadTables = new Set(['spike_tasks', 'spike_events'])
  private readonly supabase: SupabaseClient

  private constructor(
    private readonly config: PowerSyncSpikeRemoteConfig,
    supabase: SupabaseClient
  ) {
    this.supabase = supabase
  }

  static async signIn(
    config: PowerSyncSpikeRemoteConfig
  ): Promise<SupabasePowerSyncSpikeConnector> {
    const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
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
    if (error) throw new Error(`Supabase spike sign-in failed: ${error.message}`)
    return new SupabasePowerSyncSpikeConnector(config, supabase)
  }

  async fetchCredentials(): Promise<{ endpoint: string; token: string } | null> {
    const { data, error } = await this.supabase.auth.getSession()
    if (error) throw new Error(`Could not refresh Supabase session: ${error.message}`)
    if (!data.session) return null
    return {
      endpoint: this.config.powerSyncEndpoint,
      token: data.session.access_token
    }
  }

  async uploadData(database: PowerSyncDatabase): Promise<void> {
    const batch = await database.getCrudBatch(100)
    if (!batch) return

    for (const entry of batch.crud) {
      if (!SupabasePowerSyncSpikeConnector.uploadTables.has(entry.table)) {
        throw new Error(`The spike connector refuses to upload table ${entry.table}.`)
      }

      const operationData = { ...(entry.opData ?? {}) }
      if (entry.table === 'spike_events' && 'is_multi_day' in operationData) {
        operationData.is_multi_day = Boolean(operationData.is_multi_day)
      }

      let error: { message: string } | null = null
      if (entry.op === UpdateType.PUT) {
        const response = await this.supabase.from(entry.table).upsert({
          id: entry.id,
          ...operationData
        })
        error = response.error
      } else if (entry.op === UpdateType.PATCH) {
        const response = await this.supabase
          .from(entry.table)
          .update(operationData)
          .eq('id', entry.id)
        error = response.error
      } else if (entry.op === UpdateType.DELETE) {
        const response = await this.supabase.from(entry.table).delete().eq('id', entry.id)
        error = response.error
      }

      if (error) throw new Error(`Supabase rejected ${entry.op} ${entry.id}: ${error.message}`)
    }

    await batch.complete()
  }

  async getUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser()
    if (error || !data.user) {
      throw new Error(`Could not resolve the Supabase spike user: ${error?.message ?? 'no user'}`)
    }
    return data.user.id
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut({ scope: 'local' })
  }
}
