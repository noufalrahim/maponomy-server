import { warehouses } from "../../infrastructure/db/schemas/warehouse.schema";
import { BaseModel } from "./base/base.model";

export class WarehouseModel extends BaseModel<
  typeof warehouses.$inferSelect,
  typeof warehouses.$inferInsert
> {
  protected readonly table = warehouses;
}
