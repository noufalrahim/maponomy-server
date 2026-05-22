import { Response } from "express";
import { eq, sql } from "drizzle-orm";

import { db } from "../../config/database";
import { salespersons, vendors, vendorSalespersons, warehouses } from "../../infrastructure/db/schema";


function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function exportVendors(res: Response) {
  const rows = await db
    .select({
      name: vendors.name,
      address: vendors.address,
      phoneNumber: vendors.phoneNumber,
      warehouseId: vendors.warehouseId,
      warehouseName: warehouses.name,
      active: vendors.active,
      createdAt: vendors.createdAt,

      // 🔑 COMMA-SEPARATED SALESPERSON IDs and NAMES
      salespersonIds: sql<string>`
        COALESCE(
          string_agg(${salespersons.id}::text, ', ' ORDER BY ${salespersons.name}),
          ''
        )
      `.as("salesperson_ids"),
      salespersons: sql<string>`
        COALESCE(
          string_agg(${salespersons.name}, ', ' ORDER BY ${salespersons.name}),
          ''
        )
      `.as("salespersons"),
    })
    .from(vendors)
    .leftJoin(warehouses, eq(vendors.warehouseId, warehouses.id))
    .leftJoin(vendorSalespersons, eq(vendorSalespersons.vendorId, vendors.id))
    .leftJoin(salespersons, eq(vendorSalespersons.salespersonId, salespersons.id))
    .groupBy(
      vendors.id,
      vendors.name,
      vendors.address,
      vendors.phoneNumber,
      vendors.warehouseId,
      warehouses.name,
      vendors.active,
      vendors.createdAt
    );

  // Headers are already set by the ExportController

  try {
    res.write(
      "name,address,phone_number,warehouse_id,warehouse_name,active,created_at,salesperson_id,salespersons\n"
    );

    for (const r of rows) {
      res.write(
        [
          csvEscape(r.name),
          csvEscape(r.address),
          csvEscape(r.phoneNumber),
          csvEscape(r.warehouseId),
          csvEscape(r.warehouseName),
          csvEscape(r.active),
          csvEscape(r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt),
          csvEscape(r.salespersonIds),
          csvEscape(r.salespersons),
        ].join(",") + "\n"
      );
    }
  } finally {
    res.end();
  }
}
