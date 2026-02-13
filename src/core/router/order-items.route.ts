import { Router } from "express";
import { OrderItemsController } from "../controller/order-items.controller";
import createBaseRouter from "./base/base.route";
import { openApiRegistry } from "../../documentation/swagger-registry";

const router = Router();
const controller = new OrderItemsController();

const adminCrudRouter = createBaseRouter(
  controller,
  {
    enableAdvancedQuery: true,
    enableBatchCreate: false,
    enableBulkImport: false,
    enableCreateIfNotExists: false,
  },
  undefined,
  undefined,
  {
    tag: "Order Items",
    basePath: "/order-items",
    registry: openApiRegistry,
  }
);

router.use("/", adminCrudRouter);

export default router;
