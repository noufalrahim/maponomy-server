import { NewVendor, VendorRecord } from "../../infrastructure/db/schemas/vendor.schema";
import { asyncHandler } from "../../middleware/asyncHandler";
import { QuerySpec } from "../../types";
import { sendSuccess } from "../../utils/apiResponse";
import { VendorService } from "../service/vendor.service";
import { BaseController } from "./base/base.controller";
import { Request, Response } from "express";
export class VendorController extends BaseController<
  VendorRecord,
  NewVendor
> {
  protected service = new VendorService();
  protected resourceName = "vendor";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }

  override create = asyncHandler(async (req: Request, res: Response) => {
    const created = await this.service.createVendor(req.body);
    return sendSuccess(res, {
      data: created,
      message: `${this.resourceName} created successfully`,
      statusCode: 201
    });
  });

  override delete = asyncHandler(async (req: Request, res: Response) => {
    const deleted = await this.service.deleteVendor(req.params.id);
    return sendSuccess(res, {
      data: deleted,
      message: `${this.resourceName} deleted successfully`,
      statusCode: 200
    });
  })

  override getAll = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as QuerySpec;
    const fields = this.parseFieldSelection(req);
    const salespersons = await this.service.findAllVendors({
      query: body,
      fields
    });
    const count = await this.service.count({
      query: body,
      fields
    });
    return sendSuccess(res, {
      data: salespersons,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200,
      count: count
    });
  })

  override update = asyncHandler(async (req: Request, res: Response) => {
    const updated = await this.service.updateVendor(req.body);
    return sendSuccess(res, {
      data: updated,
      message: `${this.resourceName} updated successfully`,
      statusCode: 200
    });
  })

  getVendorsBySalesperson = asyncHandler(async (req: Request, res: Response) => {
    const salespersonId = req.params.salespersonId;
    const vendors = await this.service.findVendorsBySalesperson(salespersonId);
    return sendSuccess(res, {
      data: vendors,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200,
    });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { customerId, password } = req.body;
    const reset = await this.service.resetPassword(customerId, password);
    return sendSuccess(res, {
      data: reset,
      message: `${this.resourceName} reset password successfully`,
      statusCode: 200
    });
  });

}
