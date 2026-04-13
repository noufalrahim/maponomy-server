import { Router } from "express";
import { StatisticsController } from "../controller/statistics.controller";
import createBaseRouter from "./base/base.route";
import { requireAdmin } from "../../middleware/requireAdmin";
import { requireStaff } from "../../middleware/requireStaff";
import { requireSalesperson } from "../../middleware/requireSalesperson";
import { requireCustomer } from "../../middleware/requireCustomer";
import { openApiRegistry } from "../../documentation/swagger-registry";

import { requireRoles } from "../../middleware/requireRoles";
import { Role } from "../../types";

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
router.get("/salesperson/:salespersonId", requireRoles([Role.SALES_PERSON, Role.ADMIN]), controller.getSalespersonStatistics);
router.get("/progress/salesperson/:salespersonId", requireRoles([Role.SALES_PERSON, Role.ADMIN]), controller.getSalespersonProgress);
router.get("/progress/salesperson-progress", requireRoles([Role.ADMIN, Role.WAREHOUSE_MANAGER]), controller.getAllSalespersonProgress);
router.get("/customers/:customerId", requireRoles([Role.CUSTOMER, Role.ADMIN]), controller.getCustomerStatistics)

router.use("/", adminCrudRouter);

export default router;
