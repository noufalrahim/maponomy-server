import { ENV } from "./config/env"
import { connectToDatabase, pool } from "./config/database"
import { startHttpServer, stopHttpServer } from "./server"

console.log("Running in:", ENV)

async function bootstrap() {
  await connectToDatabase()
  startHttpServer()
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down...`)

  try {
    await stopHttpServer()
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error("Shutdown error", err)
    process.exit(1)
  }
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

bootstrap()
