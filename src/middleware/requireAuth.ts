import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { verifyToken, AuthError, getAccessToken } from "../utils/jwt";
import { users } from "../infrastructure/db/schema";
import { db } from "../config/database";

/**
 * Middleware to ensure any authenticated user
 */
export const requireAuth = () => {
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

            // Attach user to request
            (req as any).user = user;

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
