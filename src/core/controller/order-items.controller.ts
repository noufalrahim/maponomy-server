import { NewOrderItems, OrderItemsRecord } from "../../infrastructure/db/schemas/order-items.schema";
import { OrderItemsService } from "../service/order-items.service";
import { BaseController } from "./base/base.controller";

export class OrderItemsController extends BaseController<
  OrderItemsRecord,
  NewOrderItems
> {
  protected service = new OrderItemsService();
  protected resourceName = "order-items";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
