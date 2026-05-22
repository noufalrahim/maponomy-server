import { DatabaseError } from '../errors';

/**
 * Default query timeout in milliseconds (25 seconds)
 * Set lower than PostgreSQL statement_timeout (30s) for cleaner error handling
 */
export const DEFAULT_QUERY_TIMEOUT = 25000;

/**
 * Wrap a database query with timeout protection
 * Prevents runaway queries from exhausting database connections
 *
 * @param promise - The query promise to execute
 * @param timeoutMs - Timeout in milliseconds (default: 25000ms)
 * @param queryName - Optional query name for error messages
 * @returns The query result or throws timeout error
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   db.select().from(users).where(eq(users.id, userId)),
 *   25000,
 *   'findUserById'
 * );
 * ```
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = DEFAULT_QUERY_TIMEOUT,
    queryName?: string
): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    // Create timeout promise that rejects after specified time
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
            const errorMsg = queryName
                ? `Query '${queryName}' exceeded timeout of ${timeoutMs}ms`
                : `Query exceeded timeout of ${timeoutMs}ms`;

            reject(new DatabaseError(errorMsg, {
                timeout: timeoutMs,
                queryName
            }));
        }, timeoutMs);
    });

    try {
        // Race between the actual query and the timeout
        const result = await Promise.race([promise, timeoutPromise]);
        return result;
    } finally {
        // Always clear the timeout to prevent memory leaks
        clearTimeout(timeoutHandle!);
    }
}

/**
 * Configuration for query timeout settings
 */
export interface QueryTimeoutConfig {
    enabled: boolean;
    timeoutMs: number;
}

/**
 * Default timeout configuration
 */
export const DEFAULT_TIMEOUT_CONFIG: QueryTimeoutConfig = {
    enabled: true,
    timeoutMs: DEFAULT_QUERY_TIMEOUT
};