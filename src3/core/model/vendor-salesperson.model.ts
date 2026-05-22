import { eq } from "drizzle-orm";
import { db } from "../../config/database";
import { vendorSalespersons } from "../../infrastructure/db/schemas/vendor-salesperson.schema";
import { BaseModel } from "./base/base.model";

export class VendorSalespersonModel extends BaseModel<
  typeof vendorSalespersons.$inferSelect,
  typeof vendorSalespersons.$inferInsert
> {
  protected readonly table = vendorSalespersons;

  public async deleteByVendorId(vendorId: string) {
    return db.delete(this.table).where(eq(this.table.vendorId, vendorId));
  }
}
