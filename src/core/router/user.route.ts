import { Router } from "express";
import { UserController } from "../controller/user.controller";
import createBaseRouter from "./base/base.route";


const router = Router();
const controller = new UserController();

/* -------------------------------------------------
 * PUBLIC / AUTHENTICATED USER ENDPOINTS
 * ------------------------------------------------- */

// Authenticated user profile

/* -------------------------------------------------
 * ADMIN CRUD (SUPER ADMIN ONLY)
 * ------------------------------------------------- */

const adminCrudRouter = createBaseRouter(controller, {
  enableAdvancedQuery: true,
  enableBatchCreate: false,
  enableBulkImport: false,
  enableCreateIfNotExists: false,
});

// Apply middleware ONLY to CRUD
router.use(
  "/",
  // requireSuperAdmin(),
  adminCrudRouter
);

export default router;
