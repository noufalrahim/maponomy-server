import { db } from "../../config/database";
import { vendors } from "../../infrastructure/db/schemas/vendor.schema";
import { vendorSalespersons } from "../../infrastructure/db/schemas/vendor-salesperson.schema";
import { salespersons } from "../../infrastructure/db/schemas/salesperson.schema";
import { warehouses } from "../../infrastructure/db/schemas/warehouse.schema";
import { orders, users } from "../../infrastructure/db/schema";
import { eq, SQL, sql, desc } from "drizzle-orm";
import { BaseModel } from "./base/base.model";
import { VendorResponseDTO } from "../dto/ResponseDTO/VendorResponseDTO";

export class VendorModel extends BaseModel<
  typeof vendors.$inferSelect,
  typeof vendors.$inferInsert
> {
  protected readonly table = vendors;

  async findAllVendors(options: {
    where?: SQL;
    orderBy?: SQL | SQL[];
    limit?: number;
    offset?: number;
  } = {}) {
    let query = db
      .select({
        vendorId: vendors.id,
        name: vendors.name,
        address: vendors.address,
        phoneNumber: vendors.phoneNumber,
        active: vendors.active,
        type: vendors.type,
        createdAt: vendors.createdAt,
        updatedAt: vendors.updatedAt,
        latitude: vendors.latitude,
        longitude: vendors.longitude,
        storeImage: vendors.storeImage,

        warehouse: {
          id: warehouses.id,
          name: warehouses.name,
        },

        user: sql<{ email: string | null }>`
          jsonb_build_object(
            'email', MAX(${users.email})
          )
        `,

        salespersons: sql<{ id: string; name: string }[]>`
          COALESCE(
            jsonb_agg(
              DISTINCT jsonb_build_object(
                'id', ${salespersons.id},
                'name', ${salespersons.name}
              )
            ) FILTER (WHERE ${salespersons.id} IS NOT NULL),
            '[]'
          )
        `,

        orderCount: sql<number>`
          COUNT(DISTINCT ${orders.id})
        `,
        totalOrderValue: sql<number>`
          SUM(${orders.totalAmount})
        `,
      })
      .from(vendors)
      .leftJoin(
        warehouses,
        eq(vendors.warehouseId, warehouses.id)
      )
      .leftJoin(
        vendorSalespersons,
        eq(vendorSalespersons.vendorId, vendors.id)
      )
      .leftJoin(
        users,
        eq(users.id, vendors.userId)
      )
      .leftJoin(
        salespersons,
        eq(salespersons.id, vendorSalespersons.salespersonId)
      )
      .leftJoin(
        orders,
        eq(orders.vendorId, vendors.id)
      )
      .groupBy(
        vendors.id,
        warehouses.id
      );

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
      id: row.vendorId,
      name: row.name,
      address: row.address,
      phoneNumber: row.phoneNumber,
      active: row.active,
      warehouseId: row.warehouse ?? null,
      user: row.user,
      salespersonId: row.salespersons,
      type: row.type,
      salespersonCount: row.salespersons.length,
      orderCount: Number(row.orderCount),
      totalOrderValue: Number(row.totalOrderValue),
      latitude: row.latitude,
      longitude: row.longitude,
      storeImage: row.storeImage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async findVendorsBySalesperson(salespersonId: string): Promise<VendorResponseDTO[]> {
    const rows = await db
      .select({
        vendorId: vendors.id,
        name: vendors.name,
        address: vendors.address,
        phoneNumber: vendors.phoneNumber,
        active: vendors.active,
        type: vendors.type,
        createdAt: vendors.createdAt,
        updatedAt: vendors.updatedAt,

        warehouse: {
          id: warehouses.id,
          name: warehouses.name,
        },
      })
      .from(vendorSalespersons)
      .innerJoin(
        vendors,
        eq(vendorSalespersons.vendorId, vendors.id)
      )
      .leftJoin(
        warehouses,
        eq(vendors.warehouseId, warehouses.id)
      )
      .where(eq(vendorSalespersons.salespersonId, salespersonId))
      .orderBy(desc(vendors.createdAt));

    return rows.map(row => ({
      id: row.vendorId,
      name: row.name,
      address: row.address,
      phoneNumber: row.phoneNumber,
      active: row.active,
      type: row.type,
      warehouseId: row.warehouse ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

}
