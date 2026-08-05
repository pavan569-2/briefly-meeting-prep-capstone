// env must be imported first to validate all required variables before
// any other module initialises. If validation fails, an Error is thrown
// here at startup and Node exits with a non-zero code and a clear message.
import { env } from './config/env'
import app from './app'

app.listen(env.PORT, () => {
  console.log(`[Briefly] Backend listening on http://localhost:${env.PORT}`)
})
