export function requireHttpsUrl(value: string, setting: string): string {
  try {
    if (!/^https:\/\//i.test(value)) throw new Error()
    const url = new URL(value)
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
      throw new Error()
    }
    // Validation must not rewrite SDK endpoints (PowerSync rejects a trailing slash).
    return value
  } catch {
    // Configuration values can contain credentials; never include them in errors.
    throw new Error(`${setting} must be a valid HTTPS URL without embedded credentials.`)
  }
}

export function createHttpsFetch(transport: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const value = input instanceof Request ? input.url : String(input)
    requireHttpsUrl(value, 'Remote request')
    return transport(input, { ...init, redirect: 'error' })
  }
}

export const httpsFetch = createHttpsFetch()
