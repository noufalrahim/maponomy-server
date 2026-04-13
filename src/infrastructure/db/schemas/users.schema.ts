import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index
} from "drizzle-orm/pg-core";
import { warehouses } from "./warehouse.schema";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    email: varchar("email", { length: 320 }).notNull(),

    password: text("password").notNull(),

    role: varchar("role", { length: 50 }).notNull().default("user"),

    warehouseId: uuid("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export type UserRecord = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
