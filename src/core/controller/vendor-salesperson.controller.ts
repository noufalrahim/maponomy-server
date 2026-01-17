import { NewVendorSalesperson, VendorSalespersonRecord } from "../../infrastructure/db/schemas/vendor-salesperson.schema";
import { VendorSalespersonService } from "../service/vendor-salesperson.service";
import { BaseController } from "./base/base.controller";

export class VendorSalespersonController extends BaseController<
  VendorSalespersonRecord,
  NewVendorSalesperson
> {
  protected service = new VendorSalespersonService();
  protected resourceName = "vendor-salesperson";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
