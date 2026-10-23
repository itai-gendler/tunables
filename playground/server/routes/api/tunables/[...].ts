import { createHandler } from 'tunables/server'

/** The same operations as plain HTTP, for anything that is not the screens. */
let handle: ReturnType<typeof createHandler<PlaygroundContext>> | undefined

export default defineEventHandler(async (event) => {
  if (!handle) {
    const { tunables } = await usePlaygroundTunables()
    handle = createHandler<PlaygroundContext>({ tunables, ...access })
  }
  const response = await handle(toWebRequest(event), playgroundContext(getCookie(event, 'playground-who')))
  return response ?? createError({ statusCode: 404 })
})
