import { SQL } from 'drizzle-orm';

/**
 * Supported query operators for filtering
 */
export type QueryOperator =
    | 'eq'      // Equal
    | 'gt'      // Greater than
    | 'gte'     // Greater than or equal
    | 'lt'      // Less than
    | 'lte'     // Less than or equal
    | 'like'    // Case-insensitive LIKE
    | 'between' // Between two values
    | 'ne'      // Not equal
    | 'not'     // Not equal (alias)
    | 'notin';  // Not in array

/**
 * A single filter condition
 */
export interface FilterCondition {
    field: string;
    operator: QueryOperator;
    value: any | any[];
}

/**
 * A group of OR conditions (within a group)
 */
export interface FilterGroup {
    groupName: string;
    conditions: FilterCondition[];
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
    limit: number;
    offset: number;
    page?: number;
}

// Pagination metadata is defined in ModelTypes.ts

/**
 * Sorting parameters
 */
export interface OrderByParams {
    field: string;
    direction: 'asc' | 'desc';
}

/**
 * Parsed query structure
 */
export interface ParsedQuery {
    groups: FilterGroup[];
    orderBy?: OrderByParams;
    pagination: PaginationParams;
    fields?: string[];
    groupMode?: 'and' | 'or'; // How to combine groups (default: 'and')
}

/**
 * Query complexity limits configuration
 */
export interface QueryComplexityLimits {
    maxGroups: number;
    maxConditionsPerGroup: number;
    maxTotalConditions: number;
    maxJoins: number;
    maxLimit: number;
    defaultLimit: number;
}

/**
 * Query validation result
 */
export interface QueryValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

/**
 * Built query result
 */
export interface BuiltQuery {
    whereClause?: SQL;
    orderBy?: { column: any; direction: 'asc' | 'desc' };
}

// PaginatedResponse is defined in ModelTypes.ts