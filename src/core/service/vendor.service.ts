import { BaseFindOptions, BaseService } from "./base/base.service";
import { VendorModel } from "../model/vendor.model";
import {
  NewVendor,
  VendorRecord
} from "../../infrastructure/db/schemas/vendor.schema";
import { VendorRequestDTO, VendorUpdateDTO } from "../dto/RequestDTO/VendorRequestDTO";
import { VendorSalespersonService } from "./vendor-salesperson.service";
import { VendorResponseDTO } from "../dto/ResponseDTO/VendorResponseDTO";
import { WarehouseService } from "./warehouse.service";
import { AuthService } from "./auth.service";
import { Role } from "../../types";

export class VendorService extends BaseService<
  VendorRecord,
  NewVendor
> {
  protected readonly model = new VendorModel();

  protected readonly filterableFields = [
    "active",
    "name",
    "phoneNumber",
  ];

  protected readonly sortableFields = [
    "name",
    "createdAt"
  ];


  async createVendor(data: VendorRequestDTO): Promise<VendorRecord | null> {

    const authService = new AuthService();

    const res = await authService.registerUser({
      email: data.email,
      password: data.password,
      isActive: data.active,
      role: Role.CUSTOMER,
    });

    if (!res?.user) return null;

    const vendorSalespersonService = new VendorSalespersonService();

    const vendor = await this.model.create({
      ...data,
      userId: res.user.id,
    });

    await vendorSalespersonService.create({
      vendorId: vendor.id,
      salespersonId: data.salespersonId,
    });

    return vendor;
  }

  async updateVendor(data: VendorUpdateDTO): Promise<VendorRecord | null> {

    const vendorSalespersonService = new VendorSalespersonService();

    const vendor = await this.model.updateById(
      data.id, 
      data
    );

    await vendorSalespersonService.deleteByVendorId(data.id);

    if (data?.salespersonId) {
      await vendorSalespersonService.create({
        vendorId: vendor.id,
        salespersonId: data.salespersonId,
      });
    }

    return vendor;
  }

  async findAllVendors(options?: BaseFindOptions): Promise<VendorResponseDTO[]> {
    const where = this.compileWhere(options?.query?.where);
    const orderBy = this.compileOrder(options?.query?.sort);
    return this.model.findAllVendors({
      where,
      orderBy,
      limit: options?.query?.limit,
      offset: options?.query?.offset
    });
  }

  async findVendorsBySalesperson(salespersonId: string): Promise<VendorResponseDTO[]> {
    return this.model.findVendorsBySalesperson(salespersonId);
  };

  async resetPassword(id: string, password: string) {
    const customer = await this.model.findById(id);

    if (!customer) {
      throw new Error("Customer not found");
    }

    const authService = new AuthService();

    return authService.resetPassword(customer.userId, password);

  };
}
