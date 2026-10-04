import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import type { IpcMainInvokeEvent, WebContents } from 'electron'
import { createWindowSenderPolicy } from '../../src/main/ipc/sender-policy'
import { createRendererUrlPolicy } from '../../src/main/security/renderer-url'
import { createBundleHandler, resolveBundlePath } from '../../src/main/security/app-protocol'
import { createHttpsFetch, requireHttpsUrl } from '../../src/main/security/network'
import { isRemoteConfigured, readRemoteConfig } from '../../src/main/collaboration/remote-config'

function senderFixture() {
  const frame = { url: 'app://bundle/index.html#/tasks' }
  const window = Object.assign(new EventEmitter(), {
    id: 1,
    mainFrame: frame
  }) as unknown as WebContents
  const event = { sender: window, senderFrame: frame } as unknown as IpcMainInvokeEvent
  const policy = createWindowSenderPolicy()
  policy.allow(window, createRendererUrlPolicy())
  return { policy, window, frame, event }
}

test('registered main frame with a hash route is accepted', () => {
  const { policy, event } = senderFixture()
  assert.equal(policy.isAllowed(event), true)
})
test('unregistered window is rejected', () => {
  const { policy, event } = senderFixture()
  assert.equal(policy.isAllowed({ ...event, sender: { id: 2 } } as IpcMainInvokeEvent), false)
})
test('subframe is rejected even with the correct URL', () => {
  const { policy, event, frame } = senderFixture()
  assert.equal(
    policy.isAllowed({ ...event, senderFrame: { ...frame } } as IpcMainInvokeEvent),
    false
  )
})
test('missing sender frame is rejected without throwing', () => {
  const { policy, event } = senderFixture()
  assert.equal(policy.isAllowed({ ...event, senderFrame: null }), false)
})
test('main frame at a foreign URL is rejected', () => {
  const { policy, event, frame } = senderFixture()
  frame.url = 'app://foreign/index.html'
  assert.equal(policy.isAllowed(event), false)
})
test('destroyed window is removed from the registry', () => {
  const { policy, event, window } = senderFixture()
  window.emit('destroyed')
  assert.equal(policy.isAllowed(event), false)
})
test('bundle assets, ports, credentials, file and remote documents receive no IPC permission', () => {
  const policy = createRendererUrlPolicy()
  for (const url of [
    'app://bundle/assets/app.js',
    'app://bundle:123/index.html',
    'app://user:secret@bundle/index.html',
    'app://bundle/index.html?other',
    'file:///index.html',
    'https://bundle/index.html',
    'invalid'
  ])
    assert.equal(policy(url), false)
  assert.equal(
    createRendererUrlPolicy('http://localhost:5173')('http://localhost:5173/#/tasks'),
    true
  )
  assert.equal(policy('http://localhost:5173'), false)
})

test('resolver stays inside the renderer root and rejects encoded path tricks', () => {
  const root = resolve('renderer')
  assert.equal(
    resolveBundlePath(root, 'app://bundle/assets/app.js'),
    join(root, 'assets', 'app.js')
  )
  for (const url of [
    'app://foreign/index.html',
    'app://bundle:123/index.html',
    'app://user:secret@bundle/index.html',
    'app://bundle/%2e%2e%2fsecret',
    'app://bundle/../secret',
    'app://bundle/%2e%2e/secret',
    'app://bundle/%2fabsolute',
    'app://bundle/C%3a/secret',
    'app://bundle/assets%5c..%5csecret',
    'app://bundle/%00',
    'app://bundle/%ZZ',
    'app://bundle//server/share',
    'file:///secret'
  ])
    assert.equal(resolveBundlePath(root, url), null)
})

test('bundle handler serves GET/HEAD with MIME, rejects methods and escaping symlinks', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ba-app-protocol-'))
  assert.ok(directory.startsWith(join(tmpdir(), 'ba-app-protocol-')))
  try {
    const root = join(directory, 'renderer')
    const outside = join(directory, 'outside')
    await mkdir(root)
    await mkdir(outside)
    await writeFile(join(root, 'index.html'), '<h1>BA</h1>')
    await writeFile(join(root, 'app.js'), 'export default 1')
    await writeFile(join(outside, 'secret.txt'), 'outside')
    await symlink(outside, join(root, 'escape'), process.platform === 'win32' ? 'junction' : 'dir')
    const handle = createBundleHandler(root)
    const page = await handle(new Request('app://bundle/index.html'))
    assert.equal(page.status, 200)
    assert.equal(await page.text(), '<h1>BA</h1>')
    assert.match(page.headers.get('content-type')!, /text\/html/)
    const script = await handle(new Request('app://bundle/app.js'))
    assert.match(script.headers.get('content-type')!, /javascript/)
    assert.equal(script.headers.get('x-content-type-options'), 'nosniff')
    const head = await handle(new Request('app://bundle/index.html', { method: 'HEAD' }))
    assert.equal(head.status, 200)
    assert.equal(await head.text(), '')
    assert.equal(
      (await handle(new Request('app://bundle/index.html', { method: 'POST' }))).status,
      405
    )
    for (const url of [
      'app://bundle/missing',
      'app://bundle/escape/secret.txt',
      'app://foreign/index.html'
    ]) {
      assert.equal((await handle(new Request(url))).status, 404)
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('HTTPS configuration rejects unsafe inputs without leaking their values', () => {
  assert.equal(requireHttpsUrl('https://example.test/api', 'SETTING'), 'https://example.test/api')
  assert.equal(requireHttpsUrl('https://sync.example.test', 'SETTING'), 'https://sync.example.test')
  for (const url of [
    'http://example.test',
    'file:///secret',
    'invalid',
    'https:example.test',
    'https://user:private@example.test'
  ]) {
    assert.throws(
      () => requireHttpsUrl(url, 'SETTING'),
      (error: Error) => {
        assert.equal(
          error.message,
          'SETTING must be a valid HTTPS URL without embedded credentials.'
        )
        return true
      }
    )
  }
})
test('remote configuration rejects either insecure endpoint before use and reports unconfigured', () => {
  const environment = {
    POWERSYNC_SPIKE_ENDPOINT: 'https://sync.example.test',
    SUPABASE_URL: 'https://supabase.example.test',
    SUPABASE_PUBLISHABLE_KEY: 'synthetic-test-key'
  }
  assert.equal(isRemoteConfigured(environment), true)
  assert.equal(
    readRemoteConfig('test', 'secret', environment).supabaseUrl,
    'https://supabase.example.test'
  )
  for (const field of ['POWERSYNC_SPIKE_ENDPOINT', 'SUPABASE_URL'] as const) {
    const invalid = { ...environment, [field]: 'http://insecure.example.test' }
    assert.equal(isRemoteConfigured(invalid), false)
    assert.throws(() => readRemoteConfig('test', 'secret', invalid), new RegExp(field))
  }
  assert.equal(isRemoteConfigured({}), false)
})
test('HTTPS fetch blocks insecure requests before transport and overrides redirect options', async () => {
  let calls = 0
  const secure = createHttpsFetch(async (_input, init) => {
    calls += 1
    assert.equal(init?.redirect, 'error')
    return new Response('ok')
  })
  await assert.rejects(() => secure('http://insecure.example.test'))
  assert.equal(calls, 0)
  await secure(new Request('https://example.test', { redirect: 'follow' }), { redirect: 'follow' })
  assert.equal(calls, 1)
})
test('actual Node fetch rejects a redirect without requesting the target (test-only HTTP transport)', async () => {
  let targetRequests = 0
  const server = createServer((request, response) => {
    if (request.url === '/target') {
      targetRequests += 1
      response.end('target')
    } else {
      response.writeHead(302, { Location: '/target' })
      response.end()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  try {
    // Inject only a local test transport; the app policy still accepts only HTTPS.
    const secure = createHttpsFetch((_input, init) =>
      fetch(`http://127.0.0.1:${address.port}/redirect`, init)
    )
    await assert.rejects(() => secure('https://synthetic.example.test'), TypeError)
    assert.equal(targetRequests, 0)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
})
