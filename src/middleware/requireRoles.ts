import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { verifyToken, AuthError, getAccessToken } from "../utils/jwt";
import { users } from "../infrastructure/db/schema";
import { db } from "../config/database";
import { Role } from "../types";

/**
 * Middleware to ensure user has one of the required roles
 */
export const requireRoles = (allowedRoles: Role[]) => {
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

            if (!allowedRoles.includes(payload.type as Role)) {
                res.status(403).json({
                    error: `Access denied. ${allowedRoles.join(" or ")} privileges required.`,
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

            if (!allowedRoles.includes(user.role as Role)) {
                res.status(403).json({
                    error: `Access denied. ${allowedRoles.join(" or ")} privileges required.`,
                    code: "ROLE_REQUIRED"
                });
                return;
            }

            // Attach user to request for follow-up logic
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
