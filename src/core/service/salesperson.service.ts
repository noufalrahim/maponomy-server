import { BaseService } from "./base/base.service";
import { SalesPersonModel } from "../model/salesperson.model";
import {
  NewSalesPerson,
  SalesPersonRecord
} from "../../infrastructure/db/schemas/salesperson.schema";

export class SalesPersonService extends BaseService<
  SalesPersonRecord,
  NewSalesPerson
> {
  protected readonly model = new SalesPersonModel();
}
