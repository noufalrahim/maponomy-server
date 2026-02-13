import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { warehouses } from "./warehouse.schema";
import { users } from "./users.schema";

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    storeImage: text("store_image"),

    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),

    address: text("address").notNull(),
    phoneNumber: text("phone_number").notNull(),

    warehouseId: uuid("warehouse_id")
      .references(() => warehouses.id, {
        onDelete: "set null",
      }),

    type: text("type").notNull(),
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
    warehouseIdx: index("vendors_warehouse_id_idx").on(table.warehouseId),
    activeIdx: index("vendors_active_idx").on(table.active),
  })
);

export type VendorRecord = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
