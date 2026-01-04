import { orderItems } from "../../infrastructure/db/schemas/order-items.schema";
import { BaseModel } from "./base/base.model";

export class OrderItemsModel extends BaseModel<
  typeof orderItems.$inferSelect,
  typeof orderItems.$inferInsert
> {
  protected readonly table = orderItems;
}
