// src/utils/apiResponse.ts
import { Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  options: {
    data: T;
    message: string;
    statusCode?: number;
    count?: number;
    extra?: Record<string, unknown>;
  }
) => {
  const { data, message, statusCode = 200, count, extra } = options;

  return res.status(statusCode).json({
    success: true,
    data,
    message,
    errorMessage: null,
    statusCode,
    ...(count !== undefined ? { count } : {}),
    ...(extra ? extra : {})
  });
};

export const sendError = (
  res: Response,
  options: {
    message: string;
    errorMessage: string;
    statusCode: number;
    code?: string;
    field?: string;
    details?: unknown;
  }
) => {
  const { message, errorMessage, statusCode, code, field, details } = options;

  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errorMessage,
    statusCode,
    ...(code ? { code } : {}),
    ...(field ? { field } : {}),
    ...(details ? { details } : {})
  });
};
