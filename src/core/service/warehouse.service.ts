import { BaseFindOptions, BaseService } from "./base/base.service";
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

  protected readonly filterableFields = [
    "latitude",
    "longitude",
    "name",
    "address",
    "id"
  ];

  protected readonly sortableFields = [
    "name",
    "createdAt"
  ];


  async findAllWithVendorCount(
    options?: BaseFindOptions
  ) {
    const where = this.applyActiveFilter(this.compileWhere(options?.query?.where), options?.isAdmin);
    const orderBy = this.compileOrder(options?.query?.sort);
    return this.model.findAllWithVendorCount({
      where,
      orderBy,
      limit: options?.query?.limit,
      offset: options?.query?.offset
    });
  }
}
