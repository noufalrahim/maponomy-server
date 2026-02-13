import { Request, Response } from "express";
import { NewUser, UserRecord } from "../../infrastructure/db/schema";
import { AuthService } from "../service/auth.service";
import { BaseController } from "./base/base.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";

export class AuthController extends BaseController<UserRecord, NewUser> {
  protected service = new AuthService();
  protected resourceName = "auth";

  registerUser = asyncHandler(async (req: Request, res: Response) => {
    const validateToken = await this.service.registerUser(req.body);
    return sendSuccess(res, {
      data: validateToken,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const validateToken = await this.service.login(req.body);
    return sendSuccess(res, {
      data: validateToken,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200
    });
  });

  adminLogin = asyncHandler(async (req: Request, res: Response) => {
    const validateToken = await this.service.adminLogin(req.body);
    return sendSuccess(res, {
      data: validateToken,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200
    });
  });

  validateToken = asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }
    const validateToken = await this.service.validateToken(token.split(" ")[1]);
    return sendSuccess(res, {
      data: validateToken,
      message: `${this.resourceName} fetched successfully`,
      statusCode: 200
    });
  });
}
