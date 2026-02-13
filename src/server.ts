import http from "http"
import { PORT } from "./config/env"
import { createApp } from "./app"

let server: http.Server

export function startHttpServer() {
  const app = createApp()

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export async function stopHttpServer() {
  if (!server) return

  return new Promise<void>((resolve, reject) => {
    server.close(err => {
      if (err) reject(err)
      else resolve()
    })
  })
}
