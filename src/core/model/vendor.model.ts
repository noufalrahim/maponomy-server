import { vendors } from "../../infrastructure/db/schemas/vendor.schema";
import { BaseModel } from "./base/base.model";

export class VendorModel extends BaseModel<
  typeof vendors.$inferSelect,
  typeof vendors.$inferInsert
> {
  protected readonly table = vendors;
}
