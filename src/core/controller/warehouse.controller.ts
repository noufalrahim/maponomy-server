import { NewWarehouse, WarehouseRecord } from "../../infrastructure/db/schemas/warehouse.schema";
import { WarehouseService } from "../service/warehouse.service";
import { BaseController } from "./base/base.controller";

export class WarehouseController extends BaseController<
  WarehouseRecord,
  NewWarehouse
> {
  protected model = new WarehouseService();
  protected resourceName = "warehouse";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
