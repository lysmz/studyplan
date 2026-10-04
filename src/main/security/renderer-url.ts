export const APP_RENDERER_URL = 'app://bundle/index.html'

export function isAppBundleUrl(url: URL): boolean {
  return (
    url.protocol === 'app:' &&
    url.hostname === 'bundle' &&
    !url.port &&
    !url.username &&
    !url.password
  )
}

export function createRendererUrlPolicy(devUrl?: string): (value: string) => boolean {
  const development = devUrl ? new URL(devUrl) : null
  return (value) => {
    try {
      const url = new URL(value)
      if (development) {
        return (
          url.origin === development.origin &&
          url.protocol === development.protocol &&
          !url.username &&
          !url.password
        )
      }
      return isAppBundleUrl(url) && url.pathname === '/index.html' && !url.search
    } catch {
      return false
    }
  }
}
