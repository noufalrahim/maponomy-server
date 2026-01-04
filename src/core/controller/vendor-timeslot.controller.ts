import { NewVendorTimeslots, VendorTimeslotsRecord } from "../../infrastructure/db/schemas/vendor-timeslot.schema";
import { VendorTimeslotsService } from "../service/vendor-timeslot.service";
import { BaseController } from "./base/base.controller";

export class VendorTimeslotsController extends BaseController<
  VendorTimeslotsRecord,
  NewVendorTimeslots
> {
  protected model = new VendorTimeslotsService();
  protected resourceName = "vendor-timeslots";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
