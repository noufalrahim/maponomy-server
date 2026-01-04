import {
  pgTable,
  uuid,
  varchar,
  date,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendor.schema";
import { users } from "./users.schema";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id),

    deliveryDate: date("delivery_date").notNull(),

    status: varchar("status").notNull(),

    totalAmount: numeric("total_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    vendorIdx: index("idx_orders_vendor").on(table.vendorId),
    deliveryDateIdx: index("idx_orders_delivery_date").on(
      table.deliveryDate
    ),
    statusIdx: index("idx_orders_status").on(table.status),
  })
);

export type OrderRecord = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
