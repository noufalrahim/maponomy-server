import {
  pgTable,
  uuid,
  varchar,
  date,
  timestamp,
  numeric,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendor.schema";
import { users } from "./users.schema";
import { warehouses } from "./warehouse.schema";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    warehouseId: uuid("warehouse_id")
      .references(() => warehouses.id, { onDelete: "set null" }),

    deliveryDate: date("delivery_date").notNull(),

    deliveryStartTime: varchar("delivery_start_time").notNull(),
    deliveryEndTime: varchar("delivery_end_time").notNull(),

    status: varchar("status").notNull(),

    totalAmount: numeric("total_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    pushedToErp: boolean("pushed_to_erp").default(false),
  },
  (table) => ({
    vendorIdx: index("idx_orders_vendor").on(table.vendorId),
    warehouseIdx: index("idx_orders_warehouse").on(table.warehouseId),
    deliveryDateIdx: index("idx_orders_delivery_date").on(
      table.deliveryDate
    ),
    statusIdx: index("idx_orders_status").on(table.status),
  })
);

export type OrderRecord = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
