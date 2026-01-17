import { Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../../config/database";
import { vendors, warehouses } from "../../infrastructure/db/schema";

export default async function exportVendors(res: Response) {
  res.write(
    "name,address,phone_number,warehouse_id,warehouse_name,active,created_at\n"
  );

  const rows = await db
    .select({
      name: vendors.name,
      address: vendors.address,
      phoneNumber: vendors.phoneNumber,
      warehouseId: vendors.warehouseId,
      warehouseName: warehouses.name,
      active: vendors.active,
      createdAt: vendors.createdAt
    })
    .from(vendors)
    .leftJoin(warehouses, eq(vendors.warehouseId, warehouses.id));

  for (const r of rows) {
    res.write(
      `${r.name},${r.address},${r.phoneNumber},${r.warehouseId ?? ""},${r.warehouseName ?? ""},${r.active},${r.createdAt.toISOString()}\n`
    );
  }

  res.end();
}
