import { BaseService } from "./base/base.service";
import { OrderItemsModel } from "../../core/model/order-items.model";
import {
  NewOrderItems,
  OrderItemsRecord
} from "../../infrastructure/db/schemas/order-items.schema";

export class OrderItemsService extends BaseService<
  OrderItemsRecord,
  NewOrderItems
> {
  protected readonly model = new OrderItemsModel();
}
