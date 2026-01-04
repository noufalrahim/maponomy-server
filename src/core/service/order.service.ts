import { BaseService } from "./base/base.service";
import { OrderModel } from "../../core/model/order.model";
import {
  NewOrder,
  OrderRecord
} from "../../infrastructure/db/schemas/order.schema";

export class OrderService extends BaseService<
  OrderRecord,
  NewOrder
> {
  protected readonly model = new OrderModel();
}
