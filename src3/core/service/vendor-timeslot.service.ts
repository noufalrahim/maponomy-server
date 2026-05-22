import { BaseService } from "./base/base.service";
import { VendorTimeslotsModel } from "../model/vendor-timeslot.model";
import {
  NewVendorTimeslots,
  VendorTimeslotsRecord
} from "../../infrastructure/db/schemas/vendor-timeslot.schema";

export class VendorTimeslotsService extends BaseService<
  VendorTimeslotsRecord,
  NewVendorTimeslots
> {
  protected readonly model = new VendorTimeslotsModel();
}
