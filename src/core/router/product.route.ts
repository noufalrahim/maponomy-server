import { Router } from "express";
import { ProductController } from "../controller/product.controller";
import createBaseRouter from "./base/base.route";
import { openApiRegistry } from "../../documentation/swagger-registry";

const router = Router();
const controller = new ProductController();

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
    tag: "Product",
    basePath: "/products",
    registry: openApiRegistry,
  }
);

router.use("/", adminCrudRouter);
router.use("/customer/:customerId", controller.getByCustomerId);

export default router;
