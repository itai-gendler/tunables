import { RPCHandler } from '@orpc/server/fetch'
import { tunablesRouter } from 'tunables/orpc'

/** The app's oRPC router, with tunables nested in it as news nests its own procedures. */
let handler: RPCHandler<PlaygroundContext> | undefined

export default defineEventHandler(async (event) => {
  if (!handler) {
    const { tunables } = await usePlaygroundTunables()
    handler = new RPCHandler({ tunables: tunablesRouter<PlaygroundContext>({ tunables, ...access }) })
  }
  const context = playgroundContext(getCookie(event, 'playground-who'))
  const { matched, response } = await handler.handle(toWebRequest(event), { prefix: '/rpc', context })
  if (matched) return response
  setResponseStatus(event, 404)
  return 'Not found'
})
