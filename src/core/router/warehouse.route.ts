import { Router } from "express";
import { WarehouseController } from "../controller/warehouse.controller";
import createBaseRouter from "./base/base.route";
import { openApiRegistry } from "../../documentation/swagger-registry";

const router = Router();
const controller = new WarehouseController();

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
    tag: "Warehouse",
    basePath: "/warehouses",
    registry: openApiRegistry,
  }
);

router.use("/", adminCrudRouter);

export default router;
