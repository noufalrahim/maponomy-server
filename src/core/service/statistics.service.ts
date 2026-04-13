import { BaseService } from "./base/base.service";
import { StatisticsModel } from "../model/statistics.model";
import { NewOrder, OrderRecord } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { SalesPersonModel } from "../model/salesperson.model";
import { VendorModel } from "../model/vendor.model";
import { TokenPayload } from "../../utils/jwt";

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
    const salespersonModal = new SalesPersonModel();

    const [salesperson] = await salespersonModal.find(
      {
        where: eq((salespersonModal as any).table.id, salespersonId),
        limit: 1,
      }
    )

    if (!salesperson || !salesperson.id) {
      throw new Error("Salesperson not found");
    }

    return this.model.getSalespersonProgress(salesperson.userId, salesperson.monthlyTarget);
  }

  public async getDashboardStatistics(currentUser?: TokenPayload) {
    return this.model.getDashboardStatistics(currentUser?.warehouseId ?? undefined);
  }

  public async getSalespersonStatistics(salespersonId: string) {

    const salespersonModal = new SalesPersonModel();

    const [salesperson] = await salespersonModal.find({
      where: eq((salespersonModal as any).table.id, salespersonId),
      limit: 1,
    })

    console.log("salesperson: ", salesperson);

    if (!salesperson || !salesperson.id) {
      throw new Error("Salesperson not found");
    }

    return this.model.getSalespersonStatistics(salesperson.userId);
  }

  public async getCustomerStatistics(customerId: string) {
    const customerModel = new VendorModel();

    const [customer] = await customerModel.find({
      where: eq((customerModel as any).table.id, customerId),
      limit: 1,
    })

    console.log("customer: ", customer);

    if (!customer || !customer.id) {
      throw new Error("Customer not found");
    }

    return this.model.getCustomerStatistics(customer.userId, customerId);
  }
}
