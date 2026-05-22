import { Response } from "express";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../../config/database";
import { categories, products } from "../../infrastructure/db/schema";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function exportProducts(
  res: Response,
  fromDate: string,
  toDate: string
) {
  const rows = await db
    .select({
      categoryName: categories.name,
      name: products.name,
      measureUnit: products.measureUnit,
      packageType: products.packageType,
      price: products.price,
      quantitySold: products.quantitySold,
      sku: products.sku,
      active: products.active,
      image: products.image,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id));

  // Headers are already set by the ExportController

  try {
    res.write(
      "category_name,name,measure_unit,package_type,price,quantity_sold,sku,active,image\n"
    );

    for (const r of rows) {
      res.write(
        [
          csvEscape(r.categoryName),
          csvEscape(r.name),
          csvEscape(r.measureUnit),
          csvEscape(r.packageType),
          csvEscape(r.price),
          csvEscape(r.quantitySold),
          csvEscape(r.sku),
          csvEscape(r.active),
          csvEscape(r.image),
        ].join(",") + "\n"
      );
    }
  } finally {
    res.end();
  }
}
