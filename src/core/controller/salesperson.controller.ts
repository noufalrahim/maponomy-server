import { NewSalesPerson, SalesPersonRecord } from "../../infrastructure/db/schemas/salesperson.schema";
import { SalesPersonService } from "../service/salesperson.service";
import { BaseController } from "./base/base.controller";

export class SalesPersonController extends BaseController<
  SalesPersonRecord,
  NewSalesPerson
> {
  protected model = new SalesPersonService();
  protected resourceName = "salesperson";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
