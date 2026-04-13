import { NewOrder, OrderRecord } from "../../infrastructure/db/schemas/order.schema";
import { asyncHandler } from "../../middleware/asyncHandler";
import { QuerySpec } from "../../types";
import { sendSuccess } from "../../utils/apiResponse";
import { OrderService } from "../service/order.service";
import { BaseController } from "./base/base.controller";
import { Request, Response } from "express";
export class OrderController extends BaseController<
  OrderRecord,
  NewOrder
> {
  protected service = new OrderService();
  protected resourceName = "order";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }

  override create = asyncHandler(async (req: Request, res: Response) => {
    console.log("Body: ", req.body);
    const created = await this.service.createOrder(req.body);
    return sendSuccess(res, {
      data: created,
      message: `${this.resourceName} created successfully`,
      statusCode: 201
    });
  });

  override getAll = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as QuerySpec;
    
    const fields = this.parseFieldSelection(req);
    const isAdmin = this.getIsAdmin(req);

    const orders = await this.service.findAllOrders({
      query: body,
      fields,
      isAdmin,
      currentUser: this.getCurrentUser(req)
    });
    
    const count = await this.service.countAllOrders({
      query: body,
      fields,
      isAdmin,
      currentUser: this.getCurrentUser(req)
    });
    
    return sendSuccess(res, {
      data: orders,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200,
      count: count
    });
  });

  getAllBySalespersonId = asyncHandler(async (_req: Request, res: Response) => {
    const orders = await this.service.findAllOrdersBySalespersonId(_req.params.salespersonId);
    return sendSuccess(res, {
      data: orders,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 201
    });
  });

  getDailyLimitByCustomerId = asyncHandler(async (_req: Request, res: Response) => {
    const orders = await this.service.findDailyLimitByCustomerId(_req.params.customerId);
    return sendSuccess(res, {
      data: orders,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 201
    });
  });

  getAllOrdersByCustomerUnderSalesperson = asyncHandler(async (_req: Request, res: Response) => {
    const orders = await this.service.findAllOrdersByCustomerUnderSalesperson(_req.params.salespersonId);
    return sendSuccess(res, {
      data: orders,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 201
    });
  });

  bulkCreate = asyncHandler(async (req: Request, res: Response) => {
    const created = await this.service.bulkCreateOrders(req.body);
    return sendSuccess(res, {
      data: created,
      message: `${this.resourceName} created successfully`,
      statusCode: 201
    });
  });

  override update = asyncHandler(async (req: Request, res: Response) => {
    const updated = await this.service.updateOrder(req.params.id, req.body);
    return sendSuccess(res, {
      data: updated,
      message: `${this.resourceName} updated successfully`,
      statusCode: 200
    });
  });

  pushOrdersToErp = asyncHandler(async (req: Request, res: Response) => {
    const updated = await this.service.pushOrdersToErp(req.body);
    return sendSuccess(res, {
      data: updated,
      message: `${this.resourceName} updated successfully`,
      statusCode: 200
    });
  });
}
