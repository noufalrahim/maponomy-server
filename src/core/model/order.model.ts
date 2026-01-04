import { orders } from "../../infrastructure/db/schemas/order.schema";
import { BaseModel } from "./base/base.model";

export class OrderModel extends BaseModel<
  typeof orders.$inferSelect,
  typeof orders.$inferInsert
> {
  protected readonly table = orders;
}
