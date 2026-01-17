import { Router } from "express";
import { VendorSalespersonController } from "../controller/vendor-salesperson.controller";
import createBaseRouter from "./base/base.route";
import { openApiRegistry } from "../../documentation/swagger-registry";

const router = Router();
const controller = new VendorSalespersonController();

const adminCrudRouter = createBaseRouter(controller, {
  enableAdvancedQuery: true,
  enableBatchCreate: false,
  enableBulkImport: false,
  enableCreateIfNotExists: false,
},
  undefined,
  undefined,
  {
    tag: "Vendor Salesperson",
    basePath: "/vendor-salesperson",
    registry: openApiRegistry,
  }
);

router.use("/", adminCrudRouter);

export default router;
