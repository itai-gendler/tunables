import { createServer } from 'node:http'
import { createApp } from './app.js'

/** Run with `npx jiti examples/hono/server.ts`, then call it with an `x-person` header: sam, olivia or dana. */
const { app } = await createApp()
const port = Number(process.env.PORT ?? 3301)
createServer(async (req, res) => {
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await new Promise<string>((done) => {
    let text = ''
    req.on('data', (chunk) => { text += chunk })
    req.on('end', () => done(text))
  })
  const headers = new Headers()
  for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name, value)
  const response = await app.fetch(new Request(`http://localhost:${port}${req.url}`, { method: req.method, headers, body }))
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}).listen(port, () => console.log(`Tasklane on Hono: http://localhost:${port}/api/tunables/describe`))
