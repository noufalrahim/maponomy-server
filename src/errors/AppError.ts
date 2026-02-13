/**
 * Base Application Error Class
 * Extends native Error with HTTP status codes and operational flag
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: unknown;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        details?: unknown
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);

        // Set the prototype explicitly for instanceof checks
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * 400 Bad Request - Invalid input from client
 */
export class ValidationError extends AppError {
    constructor(message: string = "Validation failed", details?: unknown) {
        super(message, 400, true, details);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = "Authentication required") {
        super(message, 401, true);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

/**
 * 403 Forbidden - User doesn't have permission
 */
export class ForbiddenError extends AppError {
    constructor(message: string = "Access forbidden") {
        super(message, 403, true);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, 404, true);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends AppError {
    constructor(message: string = "Resource conflict", details?: unknown) {
        super(message, 409, true, details);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

/**
 * 422 Unprocessable Entity - Semantic validation errors
 */
export class UnprocessableEntityError extends AppError {
    constructor(message: string = "Unprocessable entity", details?: unknown) {
        super(message, 422, true, details);
        Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
    }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
    constructor(message: string = "Too many requests") {
        super(message, 429, true);
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

/**
 * 500 Internal Server Error - Unexpected server errors
 */
export class InternalServerError extends AppError {
    constructor(message: string = "Internal server error", details?: unknown) {
        super(message, 500, false, details);
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
    constructor(message: string = "Service unavailable") {
        super(message, 503, false);
        Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
    }
}

/**
 * 504 Gateway Timeout - Database query timeout or connection error
 */
export class DatabaseError extends AppError {
    constructor(message: string = "Database operation failed", details?: unknown) {
        super(message, 504, false, details);
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}