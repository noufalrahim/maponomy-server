import {
  pgTable,
  uuid,
  integer,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { products } from "./product.schema";
import { orders } from "./order.schema";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),

    quantity: integer("quantity").notNull(),

    unitPrice: numeric("unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    totalPrice: numeric("total_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
  },
  (table) => ({
    orderProductUniqueIdx: uniqueIndex(
      "idx_order_items_order_product"
    ).on(table.orderId, table.productId),

    productIdx: index("idx_order_items_product").on(
      table.productId
    ),
  })
);

export type OrderItemsRecord =
  typeof orderItems.$inferSelect;

export type NewOrderItems =
  typeof orderItems.$inferInsert;
