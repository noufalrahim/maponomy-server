import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  numeric,
  integer,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendor.schema";
import { categories } from "./category.schema";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: varchar("name").notNull(),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),

    measureUnit: varchar("measure_unit").notNull(),

    packageType: varchar("package_type").notNull(),

    price: numeric("price").notNull(),
    
    quantitySold: numeric("quantity_sold", { mode: "number" })
      .notNull()
      .default(0),

    sku: varchar("sku").notNull(),

    active: boolean("active").notNull().default(true),
    serviceTime: integer("service_time").notNull().default(0),
    image: varchar("image"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    itemIdx: index("idx_products_item").on(table.categoryId),

    vendorItemIdx: index("idx_products_vendor_item").on(
      table.categoryId
    ),
  })
);

export type ProductRecord = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
