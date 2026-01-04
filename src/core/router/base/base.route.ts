import { Router } from "express";

export interface BaseRouterOptions {
  enableBulkImport?: boolean;
  enableAdvancedQuery?: boolean;
  enableBatchCreate?: boolean;
  enableCreateIfNotExists?: boolean;
}

export type CrudController = {
  getAll?: any;
  getById?: any;
  create?: any;
  update?: any;
  delete?: any;

  // Optional / advanced
  createIfNotExists?: any;
};

const createBaseRouter = (
  controller: CrudController,
  options: BaseRouterOptions = {}
) => {
  const router = Router();

  /**
   * IMPORTANT:
   * Authentication, authorization, rate-limiting
   * must be applied by the parent router.
   */

  /* -------------------- ADVANCED / OPTIONAL ROUTES -------------------- */

  // Create-if-not-exists (VERY sensitive)
  if (options.enableCreateIfNotExists && controller.createIfNotExists) {
    router.post("/unique", controller.createIfNotExists);
  }

  /* -------------------- STANDARD CRUD ROUTES -------------------- */

  if (controller.getAll) {
    router.get("/", controller.getAll);
  }

  if (controller.getById) {
    router.get("/:id", controller.getById);
  }

  if (controller.create) {
    router.post("/", controller.create);
  }

  if (controller.update) {
    router.put("/:id", controller.update);
  }

  if (controller.delete) {
    router.delete("/:id", controller.delete);
  }

  return router;
};

export default createBaseRouter;
