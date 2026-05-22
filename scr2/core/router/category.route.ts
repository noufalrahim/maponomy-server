import { Router } from "express";
import { CategoryController } from "../controller/category.controller";
import createBaseRouter from "./base/base.route";
import { openApiRegistry } from "../../documentation/swagger-registry";

const router = Router();
const controller = new CategoryController();

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
    tag: "Category",
    basePath: "/categories",
    registry: openApiRegistry,
  }
);

router.use("/", adminCrudRouter);

export default router;
