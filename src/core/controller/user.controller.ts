import { NewUser, UserRecord } from "../../infrastructure/db/schemas/users.schema";
import { UserService } from "../service/user.service";
import { BaseController } from "./base/base.controller";

export class UserController extends BaseController<UserRecord, NewUser> {
  protected model = new UserService();
  protected resourceName = "user";

  constructor() {
    super();
    this.selectableFields = ["id", "email", "role", "createdAt"];
    this.defaultFields = ["id", "email", "role"];
  }
}

