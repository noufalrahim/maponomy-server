import z from "zod";

export const BaseQuerySchema = z.object({
    // Pagination
    limit: z.coerce.number().int().min(1).max(1000).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    page: z.coerce.number().int().min(1).optional(),

    // Ordering
    _order_by: z.string().optional(),
    _order_dir: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),

    // Field selection
    fields: z.string().optional(),

    // Group combination mode
    _mode: z.enum(['and', 'or', 'AND', 'OR']).optional()
}).passthrough(); // Allow additional filter fields
