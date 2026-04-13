export const Role = {
  ADMIN: 'admin',
  SALES_PERSON: 'salesperson',
  CUSTOMER: 'customer',
  WAREHOUSE_MANAGER: 'warehouse_manager',
} as const;

export type Role = typeof Role[keyof typeof Role];

export const OrderStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
} as const;


export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];