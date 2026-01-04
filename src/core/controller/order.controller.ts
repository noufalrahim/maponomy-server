import { NewOrder, OrderRecord } from "../../infrastructure/db/schemas/order.schema";
import { OrderService } from "../service/order.service";
import { BaseController } from "./base/base.controller";

export class OrderController extends BaseController<
  OrderRecord,
  NewOrder
> {
  protected model = new OrderService();
  protected resourceName = "order";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
