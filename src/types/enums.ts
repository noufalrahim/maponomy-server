export const Role = {
  USER: 'user',
  ADMIN: 'admin',
  SALES_PERSON: 'sales_person',
} as const;

export type Role = typeof Role[keyof typeof Role];