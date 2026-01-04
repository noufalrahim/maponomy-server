import { Router } from "express";
import { SalesPersonController } from "../controller/salesperson.controller";
import createBaseRouter from "./base/base.route";

const router = Router();
const controller = new SalesPersonController();

const adminCrudRouter = createBaseRouter(controller, {
  enableAdvancedQuery: true,
  enableBatchCreate: false,
  enableBulkImport: false,
  enableCreateIfNotExists: false,
});

router.use("/", adminCrudRouter);

export default router;
