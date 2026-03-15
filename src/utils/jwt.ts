import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response } from "express";
import { Role } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '1d';
const REFRESH_TOKEN_EXPIRY = '7d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

if (JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters (256 bits) for security');
}

export interface TokenPayload {
    id: string;
    type: Role;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(payload: TokenPayload): Tokens {
    const accessToken = jwt.sign(payload, JWT_SECRET!, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(payload, JWT_SECRET!, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    return { accessToken, refreshToken };
}

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = 'AuthError';
    }
}

/**
 * Verify and decode a JWT token
 * Throws AuthError with specific error codes:
 * - TOKEN_EXPIRED: Token has expired
 * - TOKEN_INVALID: Token is malformed or invalid
 */
export function verifyToken(token: string): TokenPayload {
    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as TokenPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AuthError('TOKEN_EXPIRED', 'Token has expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AuthError('TOKEN_INVALID', 'Token is invalid or malformed');
        }
        throw new AuthError('TOKEN_INVALID', 'Token verification failed');
    }
}

/**
 * Generate a secure random token for password resets
 */
export function generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate expiration date for refresh tokens (7 days from now)
 */
export function getRefreshTokenExpiry(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
}

/**
 * Calculate expiration date for password reset tokens (1 hour from now)
 */
export function getResetTokenExpiry(): Date {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now;
}

/**
 * Extract token
 */

export function getAccessToken(req: Request): string | undefined {
    const token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
        return undefined;
    }
    return token.split(" ")[1]
}