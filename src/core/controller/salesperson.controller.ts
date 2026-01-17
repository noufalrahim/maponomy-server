import { NewSalesPerson, SalesPersonRecord } from "../../infrastructure/db/schemas/salesperson.schema";
import { asyncHandler } from "../../middleware/asyncHandler";
import { QuerySpec } from "../../types";
import { sendSuccess } from "../../utils/apiResponse";
import { SalesPersonService } from "../service/salesperson.service";
import { BaseController } from "./base/base.controller";
import { NextFunction, Request, Response } from "express";

export class SalesPersonController extends BaseController<
  SalesPersonRecord,
  NewSalesPerson
> {
  protected service = new SalesPersonService();
  protected resourceName = "salesperson";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }

  override create = asyncHandler(async (req: Request, res: Response) => {
    const created = await this.service.createWithUser(req.body);
    return sendSuccess(res, {
      data: created,
      message: `${this.resourceName} created successfully`,
      statusCode: 201
    });
  })

  override getAll = asyncHandler(async (req: Request, res: Response) => {

    const body = req.body as QuerySpec;

    const fields = this.parseFieldSelection(req);
    const salespersons = await this.service.findAllSalespersonsWithProgress({
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

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { salespersonId, password } = req.body;
    const reset = await this.service.resetPassword(salespersonId, password);
    return sendSuccess(res, {
      data: reset,
      message: `${this.resourceName} reset password successfully`,
      statusCode: 200
    });
  })

}
