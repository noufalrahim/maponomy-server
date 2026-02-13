import { Pool } from "pg"
import { DATABASE_URL } from "./env"
import { drizzle } from 'drizzle-orm/node-postgres';

const dbUrl = new URL(DATABASE_URL)

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  statement_timeout: 30000,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export const db = drizzle(pool);

export async function connectToDatabase(
  retries = 10,
  delayMs = 2000
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect()

      console.log("Database connected successfully")
      console.log(`DB Host      : ${dbUrl.hostname}`)
      console.log(`DB Port      : ${dbUrl.port || "5432"}`)
      console.log(`DB Name      : ${dbUrl.pathname.replace("/", "")}`)

      client.release()
      return
    } catch (err) {
      console.error(
        `Database connection attempt ${attempt}/${retries} failed`
      )

      if (attempt === retries) {
        console.error("Database unreachable. Exiting.")
        process.exit(1)
      }

      await new Promise(res => setTimeout(res, delayMs))
    }
  }
}
