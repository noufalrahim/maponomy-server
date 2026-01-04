import { Router } from "express";
import { VendorController } from "../controller/vendor.controller";
import createBaseRouter from "./base/base.route";

const router = Router();
const controller = new VendorController();

const adminCrudRouter = createBaseRouter(controller, {
  enableAdvancedQuery: true,
  enableBatchCreate: false,
  enableBulkImport: false,
  enableCreateIfNotExists: false,
});

router.use("/", adminCrudRouter);

export default router;
