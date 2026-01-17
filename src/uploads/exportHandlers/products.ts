import { Response } from "express";

import { eq } from "drizzle-orm";
import { db } from "../../config/database";
import { categories, products } from "../../infrastructure/db/schema";

export default async function exportProducts(res: Response) {
  // CSV header
  res.write(
    "vendor_id,category_name,name,measure_unit,package_type,price,quantity_sold,sku,active,image\n"
  );

  const rows = await db
    .select({
      vendorId: products.vendorId,
      categoryName: categories.name,
      name: products.name,
      measureUnit: products.measureUnit,
      packageType: products.packageType,
      price: products.price,
      quantitySold: products.quantitySold,
      sku: products.sku,
      active: products.active,
      image: products.image
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id));

  for (const r of rows) {
    res.write(
      `${r.vendorId},${r.categoryName},${r.name},${r.measureUnit},${r.packageType},${r.price},${r.quantitySold},${r.sku},${r.active},${r.image ?? ""}\n`
    );
  }

  res.end();
}
