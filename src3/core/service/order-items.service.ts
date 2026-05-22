import { BaseService } from "./base/base.service";
import { OrderItemsModel } from "../../core/model/order-items.model";
import {
  NewOrderItems,
  OrderItemsRecord
} from "../../infrastructure/db/schemas/order-items.schema";
import { inArray } from "drizzle-orm";

export class OrderItemsService extends BaseService<
  OrderItemsRecord,
  NewOrderItems
> {
  protected readonly model = new OrderItemsModel();

  async findByOrderIds(orderIds: string[]): Promise<OrderItemsRecord[]> {
    if (orderIds.length === 0) return [];

    return this.model.find({
      where: inArray(
        (this.model as any).table.orderId,
        orderIds
      ),
    });
  }
}
