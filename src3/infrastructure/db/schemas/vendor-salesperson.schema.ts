import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { vendors } from "./vendor.schema";
import { salespersons } from "./salesperson.schema";

export const vendorSalespersons = pgTable("vendor_salespersons", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  salespersonId: uuid("salesperson_id").notNull().references(() => salespersons.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type VendorSalespersonRecord = typeof vendorSalespersons.$inferSelect;
export type NewVendorSalesperson = typeof vendorSalespersons.$inferInsert;
