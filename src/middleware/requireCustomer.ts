import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { verifyToken, AuthError, getAccessToken } from "../utils/jwt";
// import { tokenBlacklist } from "../services/TokenBlacklist";
// import { getAccessToken } from "../utils/cookies";
// import { validateSession } from "../utils/sessionValidator";
import { users } from "../infrastructure/db/schema";
import { db } from "../config/database";
import { Role } from "../types";

/**
 * Middleware to ensure only customer can access the route
 */
export const requireCustomer = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = getAccessToken(req);

            if (!token) {
                res.status(401).json({
                    error: "No token provided",
                    code: "NO_TOKEN"
                });
                return;
            }

            // const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
            // if (isBlacklisted) {
            //     res.status(401).json({
            //         error: "Token has been revoked",
            //         code: "TOKEN_REVOKED"
            //     });
            //     return;
            // }

            const payload = verifyToken(token);

            // const isValidSession = await validateSession(payload, req, res);
            // if (!isValidSession) return;

            if (payload.type !== Role.CUSTOMER) {
                res.status(403).json({
                    error: "Access denied. Customer privileges required.",
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
                    code: "ADMIN_NOT_FOUND"
                });
                return;
            }

            if (user.role !== Role.CUSTOMER) {
                res.status(403).json({
                    error: "Access denied. Customer privileges required.",
                    code: "CUSTOMER_REQUIRED"
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