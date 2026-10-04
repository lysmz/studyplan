import { readFile, realpath, stat } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { isAppBundleUrl } from './renderer-url'

function isWithin(root: string, filename: string): boolean {
  const path = relative(root, filename)
  return path !== '' && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)
}

export function resolveBundlePath(root: string, value: string): string | null {
  try {
    const url = new URL(value)
    if (!isAppBundleUrl(url)) return null
    // Check the original path too: URL parsing normalizes literal/encoded dot segments.
    const rawPath = value.match(/^app:\/\/[^/?#]*(\/[^?#]*)/)?.[1]
    if (!rawPath) return null
    const segments = rawPath.slice(1).split('/').map(decodeURIComponent)
    if (
      segments.some(
        (part) => !part || part === '.' || part === '..' || /[\\/:\x00-\x1f]/.test(part)
      )
    )
      return null
    const filename = resolve(root, ...segments)
    return isWithin(resolve(root), filename) ? filename : null
  } catch {
    return null
  }
}

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

// Only files in the bundled renderer are served, including when it resides in ASAR.
export function createBundleHandler(root: string): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
    }
    const filename = resolveBundlePath(root, request.url)
    if (!filename) return new Response(null, { status: 404 })
    try {
      const [actualRoot, actualFile] = await Promise.all([realpath(root), realpath(filename)])
      if (!isWithin(actualRoot, actualFile) || !(await stat(actualFile)).isFile()) {
        return new Response(null, { status: 404 })
      }
      const body = request.method === 'HEAD' ? null : new Uint8Array(await readFile(actualFile))
      return new Response(body, {
        headers: {
          'Content-Type':
            contentTypes[extname(actualFile).toLowerCase()] ?? 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff'
        }
      })
    } catch {
      return new Response(null, { status: 404 })
    }
  }
}
