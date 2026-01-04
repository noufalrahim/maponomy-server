import { NewVendor, VendorRecord } from "../../infrastructure/db/schemas/vendor.schema";
import { VendorService } from "../service/vendor.service";
import { BaseController } from "./base/base.controller";

export class VendorController extends BaseController<
  VendorRecord,
  NewVendor
> {
  protected model = new VendorService();
  protected resourceName = "vendor";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
