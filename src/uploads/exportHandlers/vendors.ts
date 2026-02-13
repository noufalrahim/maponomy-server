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
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=vendors.csv");

  res.write(
    "name,address,phone_number,warehouse_id,warehouse_name,active,created_at,salespersons\n"
  );

  const rows = await db
    .select({
      name: vendors.name,
      address: vendors.address,
      phoneNumber: vendors.phoneNumber,
      warehouseId: vendors.warehouseId,
      warehouseName: warehouses.name,
      active: vendors.active,
      createdAt: vendors.createdAt,

      // 🔑 COMMA-SEPARATED SALESPERSONS (NO TRAILING COMMA)
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

  for (const r of rows) {
    res.write(
      [
        csvEscape(r.name),
        csvEscape(r.address),
        csvEscape(r.phoneNumber),
        csvEscape(r.warehouseId),
        csvEscape(r.warehouseName),
        csvEscape(r.active),
        csvEscape(r.createdAt.toISOString()),
        csvEscape(r.salespersons),
      ].join(",") + "\n"
    );
  }

  res.end();
}
