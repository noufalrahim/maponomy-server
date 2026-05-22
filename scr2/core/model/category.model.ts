import { categories } from "../../infrastructure/db/schema";
import { BaseModel } from "./base/base.model";

export class CategoryModel extends BaseModel<
  typeof categories.$inferSelect,
  typeof categories.$inferInsert
> {
  protected readonly table = categories;
}
