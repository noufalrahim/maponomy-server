import { BaseService } from "./base/base.service";
import { VendorModel } from "../model/vendor.model";
import {
  NewVendor,
  VendorRecord
} from "../../infrastructure/db/schemas/vendor.schema";

export class VendorService extends BaseService<
  VendorRecord,
  NewVendor
> {
  protected readonly model = new VendorModel();
}
