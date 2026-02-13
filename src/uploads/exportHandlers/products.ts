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
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const to = new Date(`${toDate}T23:59:59.999Z`);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=products.csv"
  );

  res.write(
    "category_name,name,measure_unit,package_type,price,quantity_sold,sku,active,image\n"
  );

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
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        gte(products.createdAt, from),
        lte(products.createdAt, to)
      )
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

  res.end();
}
