import { BaseFindOptions, BaseService } from "./base/base.service";
import { SalesPersonModel } from "../model/salesperson.model";
import {
  NewSalesPerson,
  SalesPersonRecord
} from "../../infrastructure/db/schemas/salesperson.schema";
import { SalesPersonRequestDTO } from "../dto";
import { Role } from "../../types";
import { AuthService } from "./auth.service";
import { inArray } from "drizzle-orm";

export class SalesPersonService extends BaseService<
  SalesPersonRecord,
  NewSalesPerson
> {
  protected readonly model = new SalesPersonModel();

  protected readonly filterableFields = [
    "active",
    "name",
    "phoneNumber",
    "monthlyTarget",
  ];

  protected readonly sortableFields = [
    "name",
    "createdAt"
  ];


  async createWithUser(
    data: SalesPersonRequestDTO
  ): Promise<SalesPersonRecord | null> {

    const authService = new AuthService();

    const res = await authService.registerUser({
      email: data.email,
      password: data.password,
      isActive: data.active,
      role: Role.SALES_PERSON,
    });

    if (!res?.user) return null;

    return this.create({
      userId: res.user.id,
      name: data.name,
      phoneNumber: data.phoneNumber,
      monthlyTarget: data.monthlyTarget,
      active: data.active,
    });
  }

  async findByUserIds(
    userIds: string[]
  ): Promise<SalesPersonRecord[]> {
    if (userIds.length === 0) return [];

    return this.model.find({
      where: inArray(
        (this.model as any).table.userId,
        userIds
      ),
    });
  }

  async findAllSalespersonsWithProgress(options?: BaseFindOptions) {
    const where = this.compileWhere(options?.query?.where);
    const orderBy = this.compileOrder(options?.query?.sort);
    return this.model.findAllWithProgress({
      where,
      orderBy,
      limit: options?.query?.limit,
      offset: options?.query?.offset
    });
  }

  async resetPassword(id: string, password: string) {
    const salesperson = await this.model.findById(id);

    if (!salesperson) {
      throw new Error("Salesperson not found");
    }

    const authService = new AuthService();

    return authService.resetPassword(salesperson.userId, password);

  }

}
