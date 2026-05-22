import { sql } from "drizzle-orm";
import { NewProduct, ProductRecord, products } from "../../infrastructure/db/schema";
import { ProductModel } from "../model/product.model";
import { BaseFindOptions, BaseService } from "./base/base.service";
import { ProductResponseDTO } from "../dto/ResponseDTO/ProductResponseDTO";
import { ProductPriceHistoryModel } from "../model/product-price-history.model";

export class ProductService extends BaseService<
  ProductRecord,
  NewProduct
> {
  protected readonly model = new ProductModel();
  private readonly priceHistoryModel = new ProductPriceHistoryModel();

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

    return this.model.findAllWithCategory({
      where,
      orderBy,
      limit: options?.query?.limit,
      offset: options?.query?.offset
    });
  }

  async findByCustomerId(customerId: string): Promise<ProductResponseDTO[]> {
    return this.model.findByCustomerId(customerId);
  }

  async updateById(
    id: string | number,
    data: Partial<NewProduct>,
    userId?: string
  ): Promise<ProductRecord> {
    const currentProduct = await this.model.findById(id);

    if (currentProduct && data.price !== undefined && data.price !== null) {
      const oldPrice = currentProduct.price;
      const newPrice = data.price.toString();

      if (oldPrice !== newPrice) {
        await this.priceHistoryModel.create({
          productId: currentProduct.id,
          oldPrice: oldPrice,
          newPrice: newPrice,
          editedBy: userId,
        });
      }
    }

    return super.updateById(id, data, userId);
  }
}
