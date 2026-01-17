import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { sendError } from "../../utils/apiResponse";
import exportHandlers from "../../uploads/exportHandlers";

export class ExportController {
  exportData = asyncHandler(async (req: Request, res: Response) => {
    const type = req.query.type as string | undefined;

    if (!type) {
      return sendError(res, {
        message: "Export type is required",
        errorMessage: "Export type is required",
        statusCode: 400
      });
    }

    const handler = exportHandlers[type];

    if (!handler) {
      return sendError(res, {
        message: `Unsupported export type: ${type}`,
        errorMessage: `Unsupported export type: ${type}`,
        statusCode: 400
      });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type.toLowerCase()}_export.csv`
    );

    await handler(res);
  });
}
