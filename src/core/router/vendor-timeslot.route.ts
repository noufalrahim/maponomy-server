import { Router } from "express";
import { VendorTimeslotsController } from "../controller/vendor-timeslot.controller";
import createBaseRouter from "./base/base.route";

const router = Router();
const controller = new VendorTimeslotsController();

const adminCrudRouter = createBaseRouter(controller, {
  enableAdvancedQuery: true,
  enableBatchCreate: false,
  enableBulkImport: false,
  enableCreateIfNotExists: false,
});

router.use("/", adminCrudRouter);

export default router;
