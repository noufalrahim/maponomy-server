import { db } from "../../config/database";
import { products } from "../../infrastructure/db/schemas/product.schema";
import { categories } from "../../infrastructure/db/schemas/category.schema";
import { vendors } from "../../infrastructure/db/schemas/vendor.schema";
import { BaseModel } from "./base/base.model";
import { and, desc, eq, SQL } from "drizzle-orm";
import { ProductResponseDTO } from "../dto/ResponseDTO/ProductResponseDTO";

export class ProductModel extends BaseModel<
  typeof products.$inferSelect,
  typeof products.$inferInsert
> {
  protected readonly table = products;


  async findAllWithCategory(options: {
    where?: SQL;
    orderBy?: SQL | SQL[];
    limit?: number;
    offset?: number;
  } = {}): Promise<ProductResponseDTO[]> {
    let query = db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        image: products.image,
        measureUnit: products.measureUnit,
        packageType: products.packageType,
        price: products.price,
        active: products.active,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        quantitySold: products.quantitySold,
        category: {
          id: categories.id,
          name: categories.name
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))

    if (options.where) {
      (query as any) = query.where(options.where);
    }

    if (options.orderBy) {
      (query as any) = Array.isArray(options.orderBy)
        ? query.orderBy(...options.orderBy)
        : query.orderBy(options.orderBy);
    } else {
      (query as any) = query.orderBy(desc(products.createdAt));
    }

    if (options.limit) (query as any) = query.limit(options.limit);
    if (options.offset) (query as any) = query.offset(options.offset);

    const rows = await query;

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      image: row.image,
      measureUnit: row.measureUnit,
      packageType: row.packageType,
      price: row.price,
      quantitySold: row.quantitySold,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      categoryId: row.category ?? null,
    }));
  }

  async findByCustomerId(customerId: string): Promise<ProductResponseDTO[]> {
    let query = db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        image: products.image,
        measureUnit: products.measureUnit,
        packageType: products.packageType,
        price: products.price,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.active, true)));

    const rows = await query;

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      image: row.image,
      measureUnit: row.measureUnit,
      packageType: row.packageType,
      price: row.price,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      categoryId: row.category ?? null,
    }));
  }
}
