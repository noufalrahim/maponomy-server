import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { openApiRegistry } from "./swagger-registry";

export function getSwaggerSpec() {
  const generator = new OpenApiGeneratorV3(openApiRegistry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Maponomy API",
      version: "1.0.0",
    },
    servers: [{ url: "/api" }],
  });
}
