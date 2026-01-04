import { items } from "../../infrastructure/db/schemas/item.schema";
import { BaseModel } from "./base/base.model";

export class ItemModel extends BaseModel<
  typeof items.$inferSelect,
  typeof items.$inferInsert
> {
  protected readonly table = items;
}
