import {
  pgTable,
  uuid,
  text,
  boolean,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { vendors } from "./vendor.schema";

export const salespersons = pgTable(
  "sales_persons",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, {
        onDelete: "restrict",
      }),

    name: text("name").notNull(),

    phoneNumber: text("phone_number").notNull(),

    monthlyTarget: doublePrecision("monthly_target")
      .notNull()
      .default(0),

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
    userIdx: index("salespersons_user_id_idx").on(table.userId),
    vendorIdx: index("salespersons_vendor_id_idx").on(table.vendorId),
    activeIdx: index("salespersons_active_idx").on(table.active),
  })
);

export type SalesPersonRecord = typeof salespersons.$inferSelect;
export type NewSalesPerson = typeof salespersons.$inferInsert;
