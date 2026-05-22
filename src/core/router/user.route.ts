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

// Reset password for any user (e.g. warehouse managers)
router.post("/reset-password", controller.resetPassword);

router.use(
  "/",
  // requireSuperAdmin(),
  adminCrudRouter
);

export default router;
