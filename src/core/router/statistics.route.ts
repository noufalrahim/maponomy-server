import { Router } from "express";
import { StatisticsController } from "../controller/statistics.controller";
import createBaseRouter from "./base/base.route";
import { requireAdmin } from "../../middleware/requireAdmin";
import { requireStaff } from "../../middleware/requireStaff";
import { requireSalesperson } from "../../middleware/requireSalesperson";
import { requireCustomer } from "../../middleware/requireCustomer";
import { openApiRegistry } from "../../documentation/swagger-registry";

const router = Router();
const controller = new StatisticsController();

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
    tag: "Statistics",
    basePath: "/statistics",
    registry: openApiRegistry,
  }
);

router.get("/dashboard", requireStaff(), controller.getDashboardStatistics);
router.use("/", adminCrudRouter);
router.get("/salesperson/:salespersonId", requireSalesperson(), controller.getSalespersonStatistics);
router.get("/progress/salesperson/:salespersonId", requireSalesperson(), controller.getSalespersonProgress);
router.get("/progress/salesperson-progress", requireAdmin(), controller.getAllSalespersonProgress);
router.get("/customers/:customerId", requireCustomer(), controller.getCustomerStatistics)

export default router;
