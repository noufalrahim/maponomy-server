import { db } from "../../config/database";
import { warehouses } from "../../infrastructure/db/schemas/warehouse.schema";
import { vendors } from "../../infrastructure/db/schemas/vendor.schema";
import { eq, SQL, sql, desc } from "drizzle-orm";
import { BaseModel } from "./base/base.model";

export class WarehouseModel extends BaseModel<
  typeof warehouses.$inferSelect,
  typeof warehouses.$inferInsert
> {
  protected readonly table = warehouses;

  async findAllWithVendorCount(options: {
    where?: SQL;
    orderBy?: SQL | SQL[];
    limit?: number;
    offset?: number;
  } = {}) {
    let query = db
      .select({
        id: warehouses.id,
        name: warehouses.name,
        address: warehouses.address,
        latitude: warehouses.latitude,
        longitude: warehouses.longitude,
        active: warehouses.active,
        createdAt: warehouses.createdAt,
        updatedAt: warehouses.updatedAt,

        vendorCount: sql<number>`
          COUNT(DISTINCT ${vendors.id})
        `,
      })
      .from(warehouses)
      .leftJoin(
        vendors,
        eq(vendors.warehouseId, warehouses.id)
      )
      .groupBy(warehouses.id);

    if (options.where) {
      (query as any) = query.where(options.where);
    }

    if (options.orderBy) {
      (query as any) = Array.isArray(options.orderBy)
        ? query.orderBy(...options.orderBy)
        : query.orderBy(options.orderBy);
    } else {
      (query as any) = query.orderBy(desc(this.table.createdAt));
    }

    if (options.limit) (query as any) = query.limit(options.limit);
    if (options.offset) (query as any) = query.offset(options.offset);

    const rows = await query;

    return rows.map(row => ({
      ...row,
      vendorCount: Number(row.vendorCount),
    }));
  }
}
