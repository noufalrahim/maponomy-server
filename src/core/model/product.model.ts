import { products } from "../../infrastructure/db/schemas/product.schema";
import { BaseModel } from "./base/base.model";

export class ProductModel extends BaseModel<
  typeof products.$inferSelect,
  typeof products.$inferInsert
> {
  protected readonly table = products;
}
