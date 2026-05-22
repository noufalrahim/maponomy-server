export interface SwaggerRoute {
  method: "get" | "post" | "patch" | "delete";
  path: string;
  summary: string;
  requestBody?: any;
  responses?: any;
}
