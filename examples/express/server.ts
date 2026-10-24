import { createApp } from './app.js'

/** Run with `npx jiti examples/express/server.ts`, then call it with an `x-person` header: sam, olivia or dana. */
const { app } = await createApp()
const port = Number(process.env.PORT ?? 3300)
app.listen(port, () => console.log(`Tasklane on Express: http://localhost:${port}/api/tunables/describe`))
