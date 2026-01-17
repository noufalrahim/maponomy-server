import { Router, RequestHandler } from "express";
import { ZodTypeAny } from "zod";
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import * as z from "zod";

extendZodWithOpenApi(z);
export interface BaseRouterOptions {
  enableBulkImport?: boolean;
  enableAdvancedQuery?: boolean;
  enableBatchCreate?: boolean;
  enableCreateIfNotExists?: boolean;
}

export interface CrudController {
  getAll?: RequestHandler;
  getById?: RequestHandler;
  create?: RequestHandler;
  update?: RequestHandler;
  delete?: RequestHandler;
  createIfNotExists?: RequestHandler;
}

export interface CrudValidators {
  createBodyValidator?: (schema: ZodTypeAny) => RequestHandler;
  updateBodyValidator?: (schema: ZodTypeAny) => RequestHandler;
}

export interface SwaggerConfig {
  tag: string;
  basePath: string;
  registry: OpenAPIRegistry;
}

const createBaseRouter = (
  controller: CrudController,
  options: BaseRouterOptions = {},
  validators?: CrudValidators,
  schemas?: {
    create?: ZodTypeAny;
    update?: ZodTypeAny;
  },
  swagger?: SwaggerConfig
) => {
  const router = Router();

  const register = (
    method: "get" | "post" | "patch" | "delete",
    path: string,
    summary: string,
    bodySchema?: ZodTypeAny
  ) => {
    if (!swagger) return;

    swagger.registry.registerPath({
      method,
      path: `${swagger.basePath}${path}`,
      tags: [swagger.tag],
      summary,
      request: bodySchema
        ? {
            body: {
              content: {
                "application/json": {
                  schema: bodySchema,
                },
              },
            },
          }
        : undefined,
      responses: {
        200: {
          description: "Success",
        },
      },
    });
  };

  /* -------------------- ADVANCED ROUTES -------------------- */

  if (options.enableCreateIfNotExists && controller.createIfNotExists) {
    router.post("/unique", controller.createIfNotExists);
    register("post", "/unique", "Create if not exists", schemas?.create);
  }

  /* -------------------- STANDARD CRUD ROUTES -------------------- */

  if (controller.getAll) {
    router.get("/", controller.getAll);
    register("get", "/", "Get all");

    router.post("/query", controller.getAll);
    register("post", "/query", "Advanced query");
  }

  if (controller.getById) {
    router.get("/:id", controller.getById);
    register("get", "/{id}", "Get by ID");
  }

  if (controller.create) {
    if (validators?.createBodyValidator && schemas?.create) {
      router.post(
        "/",
        validators.createBodyValidator(schemas.create),
        controller.create
      );
    } else {
      router.post("/", controller.create);
    }

    register("post", "/", "Create", schemas?.create);
  }

  if (controller.update) {
    if (validators?.updateBodyValidator && schemas?.update) {
      router.patch(
        "/:id",
        validators.updateBodyValidator(schemas.update),
        controller.update
      );
    } else {
      router.patch("/:id", controller.update);
    }

    register("patch", "/{id}", "Update", schemas?.update);
  }

  if (controller.delete) {
    router.delete("/:id", controller.delete);
    register("delete", "/{id}", "Delete");
  }

  return router;
};

export default createBaseRouter;
