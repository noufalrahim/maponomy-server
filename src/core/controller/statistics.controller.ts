import { NewOrder, OrderRecord } from "../../infrastructure/db/schema";
import { asyncHandler } from "../../middleware/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { StatisticsService } from "../service/statistics.service";
import { BaseController } from "./base/base.controller";
import { Request, Response } from "express";

export class StatisticsController extends BaseController<
  OrderRecord,
  NewOrder
> {
  protected service = new StatisticsService();
  protected resourceName = "statistics";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }

  getAllSalespersonProgress = asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset } = req.query;
    const salespersonProgress = await this.service.getAllSalespersonProgress(Number(limit), Number(offset));
    return sendSuccess(res, {
      data: salespersonProgress,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200
    });
  })

  getSalespersonProgress = asyncHandler(async (req: Request, res: Response) => {
    const salespersonProgress = await this.service.getSalespersonProgress(req.params.salespersonId);
    return sendSuccess(res, {
      data: salespersonProgress,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200
    });
  })

  getDashboardStatistics = asyncHandler(async (req: Request, res: Response) => {
    const dashboardStatistics = await this.service.getDashboardStatistics((req as any).user);
    return sendSuccess(res, {
      data: dashboardStatistics,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200
    });
  });

  getSalespersonStatistics = asyncHandler(async (req: Request, res: Response) => {

    const { salespersonId } = req.params;

    const salespersonStatistics = await this.service.getSalespersonStatistics(salespersonId);
    return sendSuccess(res, {
      data: salespersonStatistics,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200
    });
  });

  getCustomerStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const customerStatistics = await this.service.getCustomerStatistics(customerId);
    return sendSuccess(res, {
      data: customerStatistics,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200
    });
  });
}
