import { Router } from "express";
import { ProductController } from "../controller/product.controller";
import createBaseRouter from "./base/base.route";

const router = Router();
const controller = new ProductController();

const adminCrudRouter = createBaseRouter(controller, {
  enableAdvancedQuery: true,
  enableBatchCreate: false,
  enableBulkImport: false,
  enableCreateIfNotExists: false,
});

router.use("/", adminCrudRouter);

export default router;
