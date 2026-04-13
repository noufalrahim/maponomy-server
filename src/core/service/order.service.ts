import { BaseFindOptions, BaseService } from "./base/base.service";
import { OrderModel } from "../../core/model/order.model";
import { and, eq } from "drizzle-orm";
import {
  NewOrder,
  OrderRecord
} from "../../infrastructure/db/schemas/order.schema";
import { CreateOrderRequestDTO, UpdateOrderRequestDTO } from "../dto/RequestDTO/OrderRequestDTO";
import { OrderResponseDTO, OrdersBySalespersonResponseDTO } from "../dto/ResponseDTO/OrderResponseDTO";
import { SalesPersonService } from "./salesperson.service";
import { VendorService } from "./vendor.service";

export class OrderService extends BaseService<
  OrderRecord,
  NewOrder
> {
  protected readonly model = new OrderModel();

  protected readonly filterableFields = [
    "deliveryDate",
    "status",
    "totalAmount",
    "createdBy",
    "customer.name",
    "salesperson.name",
    "id",
    "pushedToErp",
    "createdAt",
    "warehouseId"
  ];

  protected readonly sortableFields = [
    "name",
    "createdAt"
  ];

  async createOrder(data: CreateOrderRequestDTO): Promise<OrderRecord> {
    return this.model.createOrder(data);
  }

  async findAllOrders(options?: BaseFindOptions): Promise<OrderResponseDTO[]> {
    let where = this.applyActiveFilter(this.compileWhere(options?.query?.where), options?.isAdmin);
    where = this.applyWarehouseFilter(where, options?.currentUser);

    // Apply role-based filtering for customers and salespersons
    if (options?.isAdmin === false && options?.currentUser?.type !== 'warehouse_manager') {
       const userId = options?.currentUser?.id;
       if (userId) {
         const userFilter = eq((this.model as any).table.createdBy, userId);
         where = where ? and(where, userFilter) : userFilter;
       }
    }

    const orderBy = this.compileOrder(options?.query?.sort);
    return this.model.findAllOrders({
      where,
      orderBy,
      limit: options?.query?.limit,
      offset: options?.query?.offset
    });
  }

  async findAllOrdersByCustomerUnderSalesperson(salespersonId: string): Promise<OrderResponseDTO[]> {
    return this.model.findAllOrdersByCustomerUnderSalesperson(salespersonId);
  }

  async findAllOrdersBySalespersonId(salespersonId: string): Promise<OrdersBySalespersonResponseDTO[]> {

    const salespersonService = new SalesPersonService();
    const salesperson = await salespersonService.findById(salespersonId);

    if (!salesperson) {
      throw new Error("Salesperson not found");
    }

    return this.model.findAllOrdersBySalespersonId(salesperson.userId);
  }

  async countAllOrders(options?: BaseFindOptions): Promise<number> {
    let where = this.applyActiveFilter(this.compileWhere(options?.query?.where), options?.isAdmin);
    where = this.applyWarehouseFilter(where, options?.currentUser);

    // Apply role-based filtering for customers and salespersons
    if (options?.isAdmin === false && options?.currentUser?.type !== 'warehouse_manager') {
       const userId = options?.currentUser?.id;
       if (userId) {
         const userFilter = eq((this.model as any).table.createdBy, userId);
         where = where ? and(where, userFilter) : userFilter;
       }
    }

    return this.model.count(where);
  }

  async updateOrder(id: string, data: UpdateOrderRequestDTO): Promise<OrderRecord> {
    return this.model.updateOrder(id, data);
  }

  async findDailyLimitByCustomerId(customerId: string): Promise<{
    totalTodaysOrder: number
    limitExceeded: boolean
  }> {
    if (!customerId) {
      throw new Error("customerId is required")
    }

    const customerService = new VendorService()
    let customer = await customerService.findById(customerId)

    if (!customer) {
        // Try finding by userId
        customer = await customerService.findByUserId(customerId)
    }

    if (!customer || !customer.id) {
      return {
        totalTodaysOrder: 0,
        limitExceeded: false
      }
    }

    return this.model.findDailyLimitByCustomerId(
      customer.userId,
      customer.id
    )
  }


  async bulkCreateOrders(data: CreateOrderRequestDTO[]): Promise<OrderRecord[]> {
    return this.model.bulkCreateOrders(data);
  }

  async pushOrdersToErp(orderIds: string[]): Promise<OrderRecord[]> {
    return this.model.pushOrdersToErp(orderIds);
  }
}
