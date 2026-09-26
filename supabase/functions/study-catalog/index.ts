import catalog from './catalog.json' with { type: 'json' }

Deno.serve((request: Request) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } })
  }

  return new Response(JSON.stringify(catalog), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  })
})
