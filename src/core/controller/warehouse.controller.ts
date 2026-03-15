import { NewWarehouse, WarehouseRecord } from "../../infrastructure/db/schemas/warehouse.schema";
import { asyncHandler } from "../../middleware/asyncHandler";
import { QuerySpec } from "../../types";
import { sendSuccess } from "../../utils/apiResponse";
import { WarehouseService } from "../service/warehouse.service";
import { BaseController } from "./base/base.controller";
import { Request, Response } from "express";

export class WarehouseController extends BaseController<
  WarehouseRecord,
  NewWarehouse
> {
  protected service = new WarehouseService();
  protected resourceName = "warehouse";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }

  override getAll = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as QuerySpec;
    const fields = this.parseFieldSelection(req);
    const isAdmin = this.getIsAdmin(req);

    const warehouses = await this.service.findAllWithVendorCount({
      query: body,
      fields,
      isAdmin
    });

    const count = await this.service.count({
      query: body,
      fields,
      isAdmin
    });

    return sendSuccess(res, {
      data: warehouses,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200,
      count: count
    });
  })
}
