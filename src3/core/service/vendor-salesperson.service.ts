import { BaseService } from "./base/base.service";
import { VendorSalespersonModel } from "../../core/model/vendor-salesperson.model";
import {
  NewVendorSalesperson,
  VendorSalespersonRecord
} from "../../infrastructure/db/schemas/vendor-salesperson.schema";

export class VendorSalespersonService extends BaseService<
  VendorSalespersonRecord,
  NewVendorSalesperson
> {
  protected readonly model = new VendorSalespersonModel();

  async deleteByVendorId(vendorId: string) {
    return this.model.deleteByVendorId(vendorId);
  }
}
