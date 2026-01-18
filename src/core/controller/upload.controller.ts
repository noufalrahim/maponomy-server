import { s3 } from "../../config/s3-client";
import { asyncHandler } from "../../middleware/asyncHandler";
import importHandlers from "../../uploads/importHandlers";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { Request, Response } from "express";
import fs from "fs";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export class UploadController {
  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const type = req.body.type as string | undefined;

    console.log("File: ", file);
    console.log("Type: ", type);

    if (!file) {
      return sendError(res, {
        message: "File is required",
        errorMessage: "File is required",
        statusCode: 400
      });
    }

    if (!type) {
      fs.unlinkSync(file.path);
      return sendError(res, {
        message: "File type is required",
        errorMessage: "File type is required",
        statusCode: 400
      });
    }

    const handler = importHandlers[type];

    if (!handler) {
      fs.unlinkSync(file.path);
      return sendError(res, {
        message: `Unsupported import type: ${type}`,
        errorMessage: `Unsupported import type: ${type}`,
        statusCode: 400
      });
    }

    try {
      const result = await handler(file.path);

      fs.unlinkSync(file.path);

      return sendSuccess(res, {
        data: result,
        message: "Import completed successfully",
        statusCode: 200
      });
    } catch (error: any) {
      fs.unlinkSync(file.path);

      return sendError(res, {
        message: "Import failed",
        errorMessage: error.message,
        statusCode: 500
      });
    }
  });

  uploadImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return sendError(res, {
        message: "No file uploaded",
        errorMessage: "No file uploaded",
        statusCode: 400
      });
    }

    console.log(req.file?.mimetype, req.file?.size);


    const ext = req.file.originalname.split(".").pop();
    const key = `images/${crypto.randomUUID()}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ContentDisposition: "inline"
      })
    );

    return sendSuccess(res, {
      data: {
        key,
        url: `${process.env.STORAGE_ENDPOINT}/${process.env.S3_BUCKET}/${key}`
      },
      message: "Image uploaded successfully",
      statusCode: 200
    });
  });

}
