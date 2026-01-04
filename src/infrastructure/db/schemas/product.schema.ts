import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendor.schema";
import { items } from "./item.schema";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),

    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),

    quantity: numeric("quantity").notNull(), // supports 0.5 kg etc
    measureUnit: varchar("measure_unit").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    vendorIdx: index("idx_products_vendor").on(table.vendorId),
    itemIdx: index("idx_products_item").on(table.itemId),

    vendorItemIdx: index("idx_products_vendor_item").on(
      table.vendorId,
      table.itemId
    ),
  })
);

export type ProductRecord = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
