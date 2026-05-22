import { Router } from "express";
import { SalesPersonController } from "../controller/salesperson.controller";
import createBaseRouter from "./base/base.route";
import { validateBody } from "../../middleware/requestValidator";
import { salesPersonRequestSchema } from "../dto";
import { openApiRegistry } from "../../documentation/swagger-registry";

const router = Router();
const controller = new SalesPersonController();

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
    create: salesPersonRequestSchema,
    // update: updateSalesPersonSchema,
  },
  {
    tag: "Salesperson",
    basePath: "/salespersons",
    registry: openApiRegistry,
  }
);

router.post("/reset-password", controller.resetPassword);
router.use("/", adminCrudRouter);

export default router;
