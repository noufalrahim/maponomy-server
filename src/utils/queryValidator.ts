import { PgTable, TableConfig } from 'drizzle-orm/pg-core';
import {
    ParsedQuery,
    QueryComplexityLimits,
    QueryValidationResult,
} from '../types/QueryTypes';
import { JoinType } from '../types';
import { ValidationError } from '../errors';

/**
 * QueryValidator - Validates queries for complexity, field existence, and security
 */
export class QueryValidator {
    /**
     * Default complexity limits to prevent query bombs
     */
    static readonly DEFAULT_LIMITS: QueryComplexityLimits = {
        maxGroups: 5,
        maxConditionsPerGroup: 10,
        maxTotalConditions: 20,
        maxJoins: 5,
        maxLimit: 1000,
        defaultLimit: 50
    };

    /**
     * Validate parsed query against complexity limits and field existence
     */
    static validate(
        query: ParsedQuery,
        table: PgTable<TableConfig>,
        joins?: JoinType[],
        limits: QueryComplexityLimits = this.DEFAULT_LIMITS
    ): QueryValidationResult {
        const errors: string[] = [];

        // Validate complexity
        const complexityErrors = this.validateComplexity(query, limits);
        errors.push(...complexityErrors);

        // Validate field existence
        const fieldErrors = this.validateFields(query, table, joins);
        errors.push(...fieldErrors);

        // Validate pagination
        const paginationErrors = this.validatePagination(query, limits);
        errors.push(...paginationErrors);

        // Validate ordering
        if (query.orderBy) {
            const orderErrors = this.validateOrderBy(query.orderBy.field, table);
            errors.push(...orderErrors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate and throw if query is invalid
     */
    static validateOrThrow(
        query: ParsedQuery,
        table: PgTable<TableConfig>,
        joins?: JoinType[],
        limits?: QueryComplexityLimits
    ): void {
        const result = this.validate(query, table, joins, limits);
        if (!result.isValid) {
            throw new ValidationError(
                `Query validation failed: ${result.errors.join(', ')}`,
                result.errors
            );
        }
    }

    /**
     * Validate query complexity to prevent DOS attacks
     */
    private static validateComplexity(
        query: ParsedQuery,
        limits: QueryComplexityLimits
    ): string[] {
        const errors: string[] = [];

        // Check number of groups
        if (query.groups.length > limits.maxGroups) {
            errors.push(`Too many filter groups (max: ${limits.maxGroups}, got: ${query.groups.length})`);
        }

        // Check conditions per group
        for (const group of query.groups) {
            if (group.conditions.length > limits.maxConditionsPerGroup) {
                errors.push(
                    `Group '${group.groupName}' has too many conditions (max: ${limits.maxConditionsPerGroup}, got: ${group.conditions.length})`
                );
            }
        }

        const totalConditions = query.groups.reduce(
            (sum, group) => sum + group.conditions.length,
            0
        );
        if (totalConditions > limits.maxTotalConditions) {
            errors.push(`Too many total conditions (max: ${limits.maxTotalConditions}, got: ${totalConditions})`);
        }

        return errors;
    }

    /**
     * Validate that all queried fields exist in table or joins
     */
    private static validateFields(
        query: ParsedQuery,
        table: PgTable<TableConfig>,
        joins?: JoinType[]
    ): string[] {
        const errors: string[] = [];
        const validFields = this.getValidFields(table, joins);

        for (const group of query.groups) {
            for (const condition of group.conditions) {
                if (!validFields.has(condition.field)) {
                    errors.push(`Invalid field: ${condition.field}`);
                }
            }
        }

        if (query.fields) {
            for (const field of query.fields) {
                if (!validFields.has(field)) {
                    errors.push(`Invalid field for selection: ${field}`);
                }
            }
        }

        return errors;
    }

    /**
     * Validate pagination parameters
     */
    private static validatePagination(
        query: ParsedQuery,
        limits: QueryComplexityLimits
    ): string[] {
        const errors: string[] = [];

        if (query.pagination.limit > limits.maxLimit) {
            errors.push(`Limit too large (max: ${limits.maxLimit}, got: ${query.pagination.limit})`);
        }

        if (query.pagination.limit < 1) {
            errors.push(`Limit must be at least 1`);
        }

        if (query.pagination.offset < 0) {
            errors.push(`Offset must be non-negative`);
        }

        return errors;
    }

    /**
     * Validate order by field
     */
    private static validateOrderBy(field: string, table: PgTable<TableConfig>): string[] {
        const errors: string[] = [];

        if (!(table as any)[field]) {
            errors.push(`Invalid order_by field: ${field}`);
        }

        return errors;
    }

    /**
     * Get set of all valid fields from table and joins
     */
    private static getValidFields(
        table: PgTable<TableConfig>,
        joins?: JoinType[]
    ): Set<string> {
        const fields = new Set<string>();

        // Add main table fields
        for (const key in table) {
            if (key !== '_' && typeof (table as any)[key] === 'object') {
                fields.add(key);
            }
        }

        // Add joined table fields
        if (joins) {
            for (const join of joins) {
                for (const key in join.table) {
                    if (key !== '_' && typeof (join.table as any)[key] === 'object') {
                        fields.add(key);
                    }
                }
            }
        }

        return fields;
    }

    /**
     * Build a Map of field names to column references for O(1) lookups
     * Eliminates O(n) array iteration for each field lookup
     */
    static buildFieldMap(
        table: PgTable<TableConfig>,
        joins?: JoinType[]
    ): Map<string, any> {
        const fieldMap = new Map<string, any>();

        // Add main table fields
        for (const key in table) {
            if (key !== '_' && typeof (table as any)[key] === 'object') {
                fieldMap.set(key, (table as any)[key]);
            }
        }

        // Add joined table fields
        if (joins) {
            for (const join of joins) {
                for (const key in join.table) {
                    if (key !== '_' && typeof (join.table as any)[key] === 'object') {
                        // Don't overwrite if already exists (main table takes precedence)
                        if (!fieldMap.has(key)) {
                            fieldMap.set(key, (join.table as any)[key]);
                        }
                    }
                }
            }
        }

        return fieldMap;
    }

    /**
     * Get column reference from field name
     * Searches in main table and joins
     *
     * @param field - Field name to lookup
     * @param table - Main table
     * @param joins - Optional join tables
     * @param fieldMap - Optional pre-built field map for O(1) lookup (performance optimization)
     */
    static getColumnForField(
        field: string,
        table: PgTable<TableConfig>,
        joins?: JoinType[],
        fieldMap?: Map<string, any>
    ): any {
        // If field map provided, use O(1) lookup
        if (fieldMap) {
            return fieldMap.get(field) || null;
        }

        // Fallback to O(n) search (backward compatibility)
        // Check main table
        if ((table as any)[field]) {
            return (table as any)[field];
        }

        // Check joins
        if (joins) {
            for (const join of joins) {
                if ((join.table as any)[field]) {
                    return (join.table as any)[field];
                }
            }
        }

        return null;
    }
}