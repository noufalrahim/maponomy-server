import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { verifyToken, AuthError, getAccessToken } from "../utils/jwt";
import { users } from "../infrastructure/db/schema";
import { db } from "../config/database";

/**
 * Middleware to ensure only admin or warehouse_manager can access the route
 */
export const requireStaff = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.method === "OPTIONS") {
                return res.sendStatus(204);
            }
            const token = getAccessToken(req);
            if (!token) {
                res.status(401).json({
                    error: "No token provided",
                    code: "NO_TOKEN"
                });
                return;
            }

            const payload = verifyToken(token);

            if (payload.type !== 'admin' && payload.type !== 'warehouse_manager') {
                res.status(403).json({
                    error: "Access denied. Staff privileges required.",
                    code: "INSUFFICIENT_PERMISSIONS"
                });
                return;
            }

            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, payload.id));

            if (!user) {
                res.status(401).json({
                    error: "User not found",
                    code: "USER_NOT_FOUND"
                });
                return;
            }

            if (user.role !== 'admin' && user.role !== 'warehouse_manager') {
                res.status(403).json({
                    error: "Access denied. Staff privileges required.",
                    code: "STAFF_REQUIRED"
                });
                return;
            }

            next();
        } catch (error) {
            if (error instanceof AuthError) {
                res.status(401).json({
                    error: error.message,
                    code: error.code
                });
            } else {
                res.status(401).json({
                    error: "Authentication failed",
                    code: "AUTH_FAILED"
                });
            }
        }
    };
};
