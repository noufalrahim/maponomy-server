import { BaseService } from "./base/base.service";
import { WarehouseModel } from "../model/warehouse.model";
import {
  NewWarehouse,
  WarehouseRecord
} from "../../infrastructure/db/schemas/warehouse.schema";

export class WarehouseService extends BaseService<
  WarehouseRecord,
  NewWarehouse
> {
  protected readonly model = new WarehouseModel();
}
