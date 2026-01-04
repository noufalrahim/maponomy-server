import { Router } from "express";
import { OrderController } from "../controller/order.controller";
import createBaseRouter from "./base/base.route";

const router = Router();
const controller = new OrderController();

const adminCrudRouter = createBaseRouter(controller, {
  enableAdvancedQuery: true,
  enableBatchCreate: false,
  enableBulkImport: false,
  enableCreateIfNotExists: false,
});

router.use("/", adminCrudRouter);

export default router;
