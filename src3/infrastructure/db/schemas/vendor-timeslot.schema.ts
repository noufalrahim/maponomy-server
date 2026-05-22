import {
  pgTable,
  uuid,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { vendors } from "./vendor.schema";
import { sql } from "drizzle-orm";

export const vendorTimeslots = pgTable(
  "vendor_timeslots",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, {
        onDelete: "cascade",
      }),

    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    vendorSlotIdx: index("idx_vendor_timeslots_vendor_time").on(
      table.vendorId,
      table.startTime,
      table.endTime
    ),

    validTimeRange: check(
      "chk_vendor_timeslots_time_range",
      sql`${table.endTime} > ${table.startTime}`
    ),
  })
);


export type VendorTimeslotsRecord = typeof vendorTimeslots.$inferSelect;

export type NewVendorTimeslots = typeof vendorTimeslots.$inferInsert;
