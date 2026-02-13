import { users } from "../../infrastructure/db/schema";
import { BaseModel } from "./base/base.model";

export class UserModel extends BaseModel<
  typeof users.$inferSelect,
  typeof users.$inferInsert
> {
  protected readonly table = users;
}
