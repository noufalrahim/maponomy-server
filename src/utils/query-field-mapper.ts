import { orders, salespersons, vendors, warehouses } from "../infrastructure/db/schema";


export const QUERY_FIELD_MAP = {
    "customer.name": vendors.name,
    "warehouse.name": warehouses.name,
    "salesperson.name": salespersons.name,
    "orders.status": orders.status,
    "orders.createdAt": orders.createdAt,
} as const;

export type QueryField = keyof typeof QUERY_FIELD_MAP;
