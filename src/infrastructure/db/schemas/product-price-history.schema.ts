import {
    pgTable,
    uuid,
    numeric,
    timestamp,
} from "drizzle-orm/pg-core";
import { products } from "./product.schema";
import { users } from "./users.schema";

export const productPriceHistory = pgTable(
    "product_price_history",
    {
        id: uuid("id").primaryKey().defaultRandom(),

        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),

        oldPrice: numeric("old_price").notNull(),
        newPrice: numeric("new_price").notNull(),

        editedBy: uuid("edited_by")
            .references(() => users.id, { onDelete: "set null" }),

        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    }
);

export type ProductPriceHistoryRecord = typeof productPriceHistory.$inferSelect;
export type NewProductPriceHistory = typeof productPriceHistory.$inferInsert;
