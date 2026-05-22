import { Router } from "express";
import { VendorController } from "../controller/vendor.controller";
import createBaseRouter from "./base/base.route";
import { validateBody } from "../../middleware/requestValidator";
import { vendorRequestSchema } from "../dto/RequestDTO/VendorRequestDTO";
import { requireSalesperson } from "../../middleware/requireSalesperson";
import { openApiRegistry } from "../../documentation/swagger-registry";

const router = Router();
const controller = new VendorController();

const adminCrudRouter = createBaseRouter(
  controller,
  {
    enableAdvancedQuery: true,
    enableBatchCreate: false,
    enableBulkImport: false,
    enableCreateIfNotExists: false,
  },
  {
    createBodyValidator: validateBody,
    updateBodyValidator: validateBody,
  },
  {
    create: vendorRequestSchema,
    // update: updateSalesPersonSchema,
  },
  {
    tag: "Customers",
    basePath: "/vendors",
    registry: openApiRegistry,
  }
);

router.post("/reset-password", controller.resetPassword);
router.get("/salesperson/:salespersonId", requireSalesperson(), controller.getVendorsBySalesperson);
router.use("/", adminCrudRouter);

export default router;
