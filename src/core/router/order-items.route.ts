import { Router } from "express";
import { OrderItemsController } from "../controller/order-items.controller";
import createBaseRouter from "./base/base.route";

const router = Router();
const controller = new OrderItemsController();

const adminCrudRouter = createBaseRouter(controller, {
  enableAdvancedQuery: true,
  enableBatchCreate: false,
  enableBulkImport: false,
  enableCreateIfNotExists: false,
});

router.use("/", adminCrudRouter);

export default router;
