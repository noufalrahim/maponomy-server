import { Router } from "express";
import { ItemController } from "../controller/item.controller";
import createBaseRouter from "./base/base.route";

const router = Router();
const controller = new ItemController();

const adminCrudRouter = createBaseRouter(controller, {
  enableAdvancedQuery: true,
  enableBatchCreate: false,
  enableBulkImport: false,
  enableCreateIfNotExists: false,
});

router.use("/", adminCrudRouter);

export default router;
