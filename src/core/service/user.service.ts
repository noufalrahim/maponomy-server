import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { BaseService } from "./base/base.service";
import { UserModel } from "../model/user.model";
import { NewUser, UserRecord, users } from "../../infrastructure/db/schema";

export class UserService extends BaseService<UserRecord, NewUser> {
  protected readonly model = new UserModel();

  override async create(data: NewUser): Promise<UserRecord> {
    const existingUser = await this.model.find({
      where: eq(users.email, data.email),
      limit: 1,
    });

    if (existingUser.length > 0) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcryptjs.hash(data.password, 10);

    return super.create({
      ...data,
      password: hashedPassword,
    });
  }
  
}
