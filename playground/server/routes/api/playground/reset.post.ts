/** Seed the memory store again. Only when the playground runs for tests. */
export default defineEventHandler(async () => {
  if (process.env.PLAYGROUND_RESETTABLE !== '1') throw createError({ statusCode: 404 })
  await resetPlayground()
  return { reset: true }
})
