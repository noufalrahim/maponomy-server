import fs from "fs";
import csv from "csv-parser";
import { ImportResult } from "../../types";
import { db } from "../../config/database";
import { warehouses } from "../../infrastructure/db/schema";
import { eq } from "drizzle-orm";

interface WarehouseCsvRow {
  name?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  active?: string;
}

export default async function importWarehouses(
  filePath: string
): Promise<ImportResult & { existing: number }> {
  const rows: WarehouseCsvRow[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: WarehouseCsvRow) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  let inserted = 0;
  let failed = 0;
  let existingCount = 0;

  const errors: ImportResult["errors"] = [];

  await db.transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      const name = r.name?.trim();

      if (
        !name ||
        !r.address ||
        r.latitude === undefined ||
        r.longitude === undefined
      ) {
        failed++;
        errors.push({
          row: i + 1,
          reason: "Missing required fields (name, address, latitude, longitude)"
        });
        continue;
      }

      const latitude = Number(r.latitude);
      const longitude = Number(r.longitude);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        failed++;
        errors.push({
          row: i + 1,
          reason: "Latitude or longitude is not a valid number"
        });
        continue;
      }

      const existing = await tx
        .select({ id: warehouses.id })
        .from(warehouses)
        .where(eq(warehouses.name, name))
        .limit(1);

      if (existing.length > 0) {
        existingCount++;
        continue;
      }

      try {
        await tx.insert(warehouses).values({
          name,
          address: r.address,
          latitude,
          longitude,
          active: r.active !== undefined ? r.active === "true" : true
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
    existing: existingCount,
    errors
  };
}
