import express, {
  Request,
  Response,
  NextFunction
} from "express"
import { IS_PROD } from "./config/env"
import router from "./core/router"
import cors from "cors"
import swaggerUi from "swagger-ui-express";
import { getSwaggerSpec } from "./documentation/swagger";
export function createApp() {
  const APP_START_TIME = Date.now()
  const app = express()

  // --------------------
  // Debug logging
  // --------------------
  if (!IS_PROD) {
    console.log("Debug logging enabled")
  }

  // --------------------
  // Middleware
  // --------------------
  app.use(express.json())
  app.use(
    cors({
      origin: "http://178.236.185.239:9221",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )

  // --------------------
  // Routes
  // --------------------

  // app.use("/api/auth", authRouter);
  app.use("/api", router);

  // --------------------
  // Documentation
  // --------------------
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(getSwaggerSpec()));

  // --------------------
  // Health & Ops
  // --------------------
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "UP",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  })

  // Liveness probe (process is alive)
  app.get("/health/live", (_req: Request, res: Response) => {
    res.status(200).send("OK")
  })


  // Readiness probe (override later with DB check)
  app.get("/health/ready", (_req: Request, res: Response) => {
    res.status(200).send("READY")
  })

  // Metrics (dev only)
  if (!IS_PROD) {
    app.get("/metrics", (_req: Request, res: Response) => {
      res.status(200).json({
        uptimeMs: Date.now() - APP_START_TIME,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      })
    })
  }

  // Info
  app.get("/info", (_req: Request, res: Response) => {
    res.status(200).json({
      service: "backend",
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
    })
  })

  app.get("/version", (_req: Request, res: Response) => {
    res.status(200).json({
      version: process.env.APP_VERSION || "1.0.0",
    })
  })

  // --------------------
  // Error handler (MUST be last)
  // --------------------
  app.use((
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(err)

    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    })
  })

  return app
}
