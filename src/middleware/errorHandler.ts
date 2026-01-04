import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';

/**
 * Error response interface
 */
interface ErrorResponse {
    status: 'error';
    message: string;
    error: string;  // Alias for message for frontend compatibility
    statusCode: number;
    code?: string;  // Error type code for programmatic handling
    field?: string;
    details?: unknown;
    stack?: string;
}

/**
 * Centralized error handling middleware
 * IMPORTANT: Must be registered AFTER all routes
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let statusCode = 500;
    let message = 'Internal server error';
    let details: unknown = undefined;
    let isOperational = false;
    let code: string | undefined = undefined;
    let field: string | undefined = undefined;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        details = err.details;
        isOperational = err.isOperational;
        code = err.constructor.name;

        if (statusCode === 400) {
            const fieldMatch = message.match(/^([\w]+)\s+(is|must|cannot|should)/i);
            if (fieldMatch) {
                field = fieldMatch[1].toLowerCase();
            }
        }
    }
    else if (err instanceof ZodError) {
        statusCode = 400;
        const firstIssue = err.issues[0];
        message = firstIssue ? firstIssue.message : 'Validation failed';
        field = firstIssue ? firstIssue.path.join('.') : undefined;
        code = 'ZodValidationError';
        details = err.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
        }));
        isOperational = true;
    }
    else {
        console.error('Unhandled error:', {
            name: err.name,
            message: err.message,
            stack: err.stack
        });

        message = 'An unexpected error occurred';
        code = 'UnknownError';
        isOperational = false;
    }

    const errorResponse: ErrorResponse = {
        status: 'error',
        message,
        error: message,
        statusCode
    };

    if (code) {
        errorResponse.code = code;
    }

    if (field) {
        errorResponse.field = field;
    }

    if (isOperational && details) {
        errorResponse.details = details;
    }

    if (process.env.NODE_ENV === 'development' && err.stack) {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler for unmatched routes
 * Register this AFTER all routes but BEFORE errorHandler
 */
export const notFoundHandler = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const error = new AppError(
        `Route not found: ${req.method} ${req.originalUrl}`,
        404,
        true
    );
    next(error);
};

/**
 * Async handler wrapper to catch promise rejections
 * Use this to wrap async route handlers
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};