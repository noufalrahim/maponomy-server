import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateBody =
  (schema: ZodSchema) =>
    (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: "Invalid request body",
          details: result.error.flatten(),
        });
        return;
      }

      req.body = result.data;
      next();
    };
