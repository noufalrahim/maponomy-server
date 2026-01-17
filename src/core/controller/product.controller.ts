import { NewProduct, ProductRecord } from "../../infrastructure/db/schemas/product.schema";
import { asyncHandler } from "../../middleware/asyncHandler";
import { QuerySpec } from "../../types";
import { sendSuccess } from "../../utils/apiResponse";
import { ProductService } from "../service/product.service";
import { BaseController } from "./base/base.controller";
import { Request, Response } from "express";
export class ProductController extends BaseController<
  ProductRecord,
  NewProduct
> {
  protected service = new ProductService();
  protected resourceName = "product";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }

  override getAll = asyncHandler(async (req: Request, res: Response) => {

    const body = req.body as QuerySpec;

    const fields = this.parseFieldSelection(req);

    const productsData = await this.service.findAllProducts({
      query: body,
      fields
    });

    const count = await this.service.count({
      query: body,
      fields
    });

    return sendSuccess(res, {
      data: productsData,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200,
      count: count
    });
  });

  getByCustomerId = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.params.customerId;
    const productsData = await this.service.findByCustomerId(customerId);
    return sendSuccess(res, {
      data: productsData,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200,
    });
  });
}
