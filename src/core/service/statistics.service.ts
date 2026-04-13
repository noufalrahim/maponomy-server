import { BaseService } from "./base/base.service";
import { StatisticsModel } from "../model/statistics.model";
import { NewOrder, OrderRecord } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { SalesPersonModel } from "../model/salesperson.model";
import { VendorModel } from "../model/vendor.model";
import { TokenPayload } from "../../utils/jwt";
import { SalesPersonService } from "./salesperson.service";
import { VendorService } from "./vendor.service";

export class StatisticsService extends BaseService<
  OrderRecord,
  NewOrder
> {
  protected readonly model = new StatisticsModel();

  public async getAllSalespersonProgress(
    limit = 50,
    offset = 0
  ) {
    return this.model.getAllSalespersonProgress({ limit, offset });
  }

  public async getSalespersonProgress(salespersonId: string) {
    const salespersonService = new SalesPersonService();

    let salesperson = await salespersonService.findById(salespersonId);

    if (!salesperson) {
      const salespersons = await salespersonService.findByUserIds([salespersonId]);
      salesperson = salespersons[0] || null;
    }

    if (!salesperson || !salesperson.id) {
       return {
        totalOrdersThisMonth: 0,
        totalDeliveredOrdersThisMonth: 0,
        totalPendingOrdersThisMonth: 0,
        totalCancelledOrdersThisMonth: 0,
        totalAmountAchievedThisMonth: 0,
        totalAmountTargetThisMonth: 0,
       }
    }

    return this.model.getSalespersonProgress(salesperson.userId, salesperson.monthlyTarget);
  }

  public async getDashboardStatistics(currentUser?: TokenPayload) {
    return this.model.getDashboardStatistics(currentUser?.warehouseId ?? undefined);
  }

  public async getSalespersonStatistics(salespersonId: string) {
    const salespersonService = new SalesPersonService();

    let salesperson = await salespersonService.findById(salespersonId);

    if (!salesperson) {
      const salespersons = await salespersonService.findByUserIds([salespersonId]);
      salesperson = salespersons[0] || null;
    }

    if (!salesperson || !salesperson.id) {
       return {
          totalVendors: 0,
          totalOrders: 0,
          totalAchievedThisMonth: 0,
          achievementPercentage: 0,
          weeklyBreakdown: []
       }
    }

    return this.model.getSalespersonStatistics(salesperson.userId);
  }

  public async getCustomerStatistics(customerId: string) {
    const customerService = new VendorService();

    let customer = await customerService.findById(customerId);

    if (!customer) {
      customer = await customerService.findByUserId(customerId);
    }

    if (!customer || !customer.id) {
      return {
          totalOrders: 0,
          totalApprovedOrders: 0,
          totalPendingOrders: 0,
          totalAmount: 0,
          frequentlyOrderedProducts: [],
      }
    }

    return this.model.getCustomerStatistics(customer.userId, customer.id);
  }
}
