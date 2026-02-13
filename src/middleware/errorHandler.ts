import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors";
import { sendError } from "../utils/apiResponse";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {

  if (err instanceof AppError) {
    sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      errorMessage: err.message,
      code: err.constructor.name,
      details: err.details
    });
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, {
      statusCode: 400,
      message: "Validation failed",
      errorMessage: err.issues[0]?.message ?? "Invalid input",
      code: "ZodValidationError",
      details: err.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code
      }))
    });
    return;
  }

  console.error("Unhandled error:", err);

  sendError(res, {
    statusCode: 500,
    message: "Internal server error",
    errorMessage: "Something went wrong. Please try again later.",
    code: "UnknownError"
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  sendError(res, {
    statusCode: 404,
    message: "Route not found",
    errorMessage: `Cannot ${req.method} ${req.originalUrl}`,
    code: "NotFound"
  });
};

