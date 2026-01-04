"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
function createApp() {
    const APP_START_TIME = Date.now();
    const app = (0, express_1.default)();
    if (!env_1.IS_PROD) {
        console.log("Debug logging enabled");
    }
    // --------------------
    // Middleware
    // --------------------
    app.use(express_1.default.json());
    // --------------------
    // Health & Ops
    // --------------------
    app.get("/health", (_req, res) => {
        res.status(200).json({
            status: "UP",
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
        });
    });
    // Liveness probe (process is alive)
    app.get("/health/live-kuutan", (_req, res) => {
        res.status(200).send("OK");
    });
    // Readiness probe (override later with DB check)
    app.get("/health/ready", (_req, res) => {
        res.status(200).send("READY");
    });
    // Metrics (dev only)
    if (!env_1.IS_PROD) {
        app.get("/metrics", (_req, res) => {
            res.status(200).json({
                uptimeMs: Date.now() - APP_START_TIME,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
            });
        });
    }
    // Info
    app.get("/info", (_req, res) => {
        res.status(200).json({
            service: "backend",
            environment: process.env.NODE_ENV || "development",
            nodeVersion: process.version,
        });
    });
    app.get("/version", (_req, res) => {
        res.status(200).json({
            version: process.env.APP_VERSION || "1.0.0",
        });
    });
    // --------------------
    // Error handler (MUST be last)
    // --------------------
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error",
        });
    });
    return app;
}
