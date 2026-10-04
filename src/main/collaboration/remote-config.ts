import type { CollaborationRemoteConfig } from './connector'
import { requireHttpsUrl } from '../security/network'

export function readRemoteConfig(
  email: string,
  password: string,
  environment: NodeJS.ProcessEnv
): CollaborationRemoteConfig {
  const endpoint = environment.POWERSYNC_SPIKE_ENDPOINT?.trim()
  const url = environment.SUPABASE_URL?.trim()
  const key = (environment.SUPABASE_PUBLISHABLE_KEY ?? environment.SUPABASE_ANON_KEY)?.trim()
  if (!endpoint || !url || !key) {
    throw new Error('Configure PowerSync and Supabase before using synchronized groups.')
  }
  return {
    powerSyncEndpoint: requireHttpsUrl(endpoint, 'POWERSYNC_SPIKE_ENDPOINT'),
    supabaseUrl: requireHttpsUrl(url, 'SUPABASE_URL'),
    supabasePublishableKey: key,
    email,
    password
  }
}

export function isRemoteConfigured(environment: NodeJS.ProcessEnv): boolean {
  try {
    readRemoteConfig('', '', environment)
    return true
  } catch {
    return false
  }
}
