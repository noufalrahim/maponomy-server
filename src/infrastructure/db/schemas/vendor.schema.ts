import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { warehouses } from "./warehouse.schema";

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: text("name").notNull(),
    address: text("address").notNull(),
    phone_number: text("phone_number").notNull(),

    warehouse_id: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, {
        onDelete: "restrict",
      }),

    active: boolean("active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => ({
    warehouseIdx: index("vendors_warehouse_id_idx").on(table.warehouse_id),
    activeIdx: index("vendors_active_idx").on(table.active),
  })
);

export type VendorRecord = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
