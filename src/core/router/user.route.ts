import { Router } from "express";
import { UserController } from "../controller/user.controller";
import createBaseRouter from "./base/base.route";
import { openApiRegistry } from "../../documentation/swagger-registry";

const router = Router();
const controller = new UserController();

/* -------------------------------------------------
 * ADMIN CRUD (SUPER ADMIN ONLY)
 * ------------------------------------------------- */

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
    tag: "User",
    basePath: "/users",
    registry: openApiRegistry,
  }
);

router.use(
  "/",
  // requireSuperAdmin(),
  adminCrudRouter
);

export default router;
