import { sql } from "drizzle-orm";
import { NewProduct, ProductRecord, products } from "../../infrastructure/db/schema";
import { ProductModel } from "../model/product.model";
import { BaseFindOptions, BaseService } from "./base/base.service";
import { ProductResponseDTO } from "../dto/ResponseDTO/ProductResponseDTO";

export class ProductService extends BaseService<
  ProductRecord,
  NewProduct
> {
  protected readonly model = new ProductModel();

  protected readonly filterableFields = [
    "name",
    "active",
    "vendorId",
    "categoryId",
    "price",
    "quantitySold"
  ];

  protected readonly sortableFields = [
    "price",
    "quantitySold",
    "createdAt"
  ];

  protected readonly sortExpressions = {
    revenue: sql`${products.price} * ${products.quantitySold}`
  };

  async findAllProducts(options?: BaseFindOptions): Promise<ProductResponseDTO[]> {
    const where = this.compileWhere(options?.query?.where);
    const orderBy = this.compileOrder(options?.query?.sort);

    return this.model.findAllWithCategoryAndVendor({
      where,
      orderBy,
      limit: options?.query?.limit,
      offset: options?.query?.offset
    });
  }

  async findByCustomerId(customerId: string): Promise<ProductResponseDTO[]> {
    return this.model.findByCustomerId(customerId);
  }
}
