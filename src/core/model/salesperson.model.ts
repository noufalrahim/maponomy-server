import { salespersons } from "../../infrastructure/db/schemas/salesperson.schema";
import { BaseModel } from "./base/base.model";

export class SalesPersonModel extends BaseModel<
  typeof salespersons.$inferSelect,
  typeof salespersons.$inferInsert
> {
  protected readonly table = salespersons;
}
