import { Router } from "express";
import { OrderController } from "../controller/order.controller";
import createBaseRouter from "./base/base.route";
import { requireSalesperson } from "../../middleware/requireSalesperson";
import { validateBody } from "../../middleware/requestValidator";
import { createOrderRequestSchema } from "../dto/RequestDTO/OrderRequestDTO";
import { openApiRegistry } from "../../documentation/swagger-registry";
import { requireAdmin } from "../../middleware/requireAdmin";

import { requireStaff } from "../../middleware/requireStaff";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();
const controller = new OrderController();

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
    tag: "Order",
    basePath: "/orders",
    registry: openApiRegistry,
  }
);

router.get("/salesperson/:salespersonId", requireSalesperson(), controller.getAllBySalespersonId);
router.get("/customer/:salespersonId", controller.getAllOrdersByCustomerUnderSalesperson);
router.get("/customer/:customerId/daily-limit", controller.getDailyLimitByCustomerId);
router.post("/bulk-orders", [requireSalesperson(), validateBody(createOrderRequestSchema.array())], controller.bulkCreate);
router.post("/push-to-erp", requireAdmin(), controller.pushOrdersToErp)

router.use("/", requireAuth(), adminCrudRouter);

export default router;
