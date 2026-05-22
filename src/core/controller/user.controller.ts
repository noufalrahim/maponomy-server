import { Request, Response } from "express";
import { NewUser, UserRecord } from "../../infrastructure/db/schemas/users.schema";
import { UserService } from "../service/user.service";
import { BaseController } from "./base/base.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";

export class UserController extends BaseController<UserRecord, NewUser> {
  protected service = new UserService();
  protected resourceName = "user";

  constructor() {
    super();
    this.selectableFields = ["id", "email", "role", "createdAt"];
    this.defaultFields = ["id", "email", "role"];
  }

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { userId, password } = req.body;
    if (!userId || !password) {
      throw new Error("userId and password are required");
    }
    const updated = await this.service.resetPassword(userId, password);
    return sendSuccess(res, {
      data: updated,
      message: "Password reset successfully",
      statusCode: 200,
    });
  });
}

