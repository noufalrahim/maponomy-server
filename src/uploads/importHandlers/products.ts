import fs from "fs";
import csv from "csv-parser";
import { eq } from "drizzle-orm";
import { ImportResult } from "../../types";
import { db } from "../../config/database";
import { categories, products } from "../../infrastructure/db/schema";

interface ProductCsvRow {
  vendor_id?: string;
  category_name?: string;
  name?: string;
  measure_unit?: string;
  package_type?: string;
  price?: string;
  quantity_sold?: string;
  sku?: string;
  active?: string;
  image?: string;
}

export default async function importProducts(
  filePath: string
): Promise<ImportResult & { existing: number }> {
  const rows: ProductCsvRow[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: ProductCsvRow) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  let inserted = 0;
  let failed = 0;
  let existing = 0;

  const errors: ImportResult["errors"] = [];

  await db.transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      const vendorId = r.vendor_id?.trim();
      const categoryName = r.category_name?.trim();
      const name = r.name?.trim();
      const measureUnit = r.measure_unit?.trim();
      const packageType = r.package_type?.trim();
      const sku = r.sku?.trim();

      if (
        !vendorId ||
        !categoryName ||
        !name ||
        !measureUnit ||
        !packageType ||
        !r.price ||
        !sku
      ) {
        failed++;
        errors.push({
          row: i + 1,
          reason:
            "Missing required fields (vendor_id, category_name, name, measure_unit, package_type, price, sku)"
        });
        continue;
      }

      const price = Number(r.price);
      const quantitySold = r.quantity_sold
        ? Number(r.quantity_sold)
        : 0;

      if (Number.isNaN(price) || Number.isNaN(quantitySold)) {
        failed++;
        errors.push({
          row: i + 1,
          reason: "Price or quantity_sold is not a valid number"
        });
        continue;
      }

      const existingProduct = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.sku, sku))
        .limit(1);

      if (existingProduct.length > 0) {
        existing++;
        continue;
      }

      try {
        let categoryId: string;

        const existingCategory = await tx
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.name, categoryName))
          .limit(1);

        if (existingCategory.length > 0) {
          categoryId = existingCategory[0].id;
        } else {
          const [newCategory] = await tx
            .insert(categories)
            .values({ name: categoryName })
            .returning({ id: categories.id });

          categoryId = newCategory.id;
        }

        await tx.insert(products).values({
          vendorId,
          categoryId,
          name,
          measureUnit,
          packageType,
          price: r.price.toString(),
          quantitySold,
          sku,
          active: r.active !== undefined ? r.active === "true" : true,
          image: r.image?.trim() || null
        });

        inserted++;
      } catch (e: any) {
        failed++;
        errors.push({
          row: i + 1,
          reason: e.message
        });
      }
    }
  });

  return {
    total: rows.length,
    inserted,
    failed,
    existing,
    errors
  };
}
