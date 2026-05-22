import { vendorTimeslots } from "../../infrastructure/db/schemas/vendor-timeslot.schema";
import { BaseModel } from "./base/base.model";

export class VendorTimeslotsModel extends BaseModel<
  typeof vendorTimeslots.$inferSelect,
  typeof vendorTimeslots.$inferInsert
> {
  protected readonly table = vendorTimeslots;
}
