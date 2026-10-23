import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express'
import { createHandler, type HandlerOptions } from './index.js'

/**
 * tunables' HTTP API as Express middleware. It answers under its base path and
 * passes everything else on with `next()`. The context the options receive is
 * the Express request, so `actor` and `authorize` read your session from it.
 *
 *   app.use(tunablesMiddleware({ tunables, actor: req => req.user?.id, authorize: req => req.user?.admin }))
 */
export function tunablesMiddleware(options: HandlerOptions<ExpressRequest>) {
  const handle = createHandler<ExpressRequest>(options)
  return async function tunables(req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<void> {
    try {
      const url = `${req.protocol}://${req.get('host') ?? 'localhost'}${req.originalUrl}`
      const headers = new Headers()
      for (const [name, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) value.forEach(item => headers.append(name, item))
        else if (value !== undefined) headers.set(name, value)
      }
      let body: string | undefined
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        // A body parser may have read the stream already.
        body = req.body !== undefined && typeof req.body === 'object' && !Buffer.isBuffer(req.body)
          ? JSON.stringify(req.body)
          : await readBody(req)
      }
      const response = await handle(new Request(url, { method: req.method, headers, body }), req)
      if (!response) return next()
      res.status(response.status)
      response.headers.forEach((value, name) => res.setHeader(name, value))
      res.send(Buffer.from(await response.arrayBuffer()))
    } catch (error) {
      next(error)
    }
  }
}

function readBody(req: ExpressRequest): Promise<string> {
  if (typeof req.body === 'string') return Promise.resolve(req.body)
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString('utf8'))
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}
