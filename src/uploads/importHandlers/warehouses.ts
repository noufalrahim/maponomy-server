import csv from "csv-parser";
import { Readable } from "stream";
import { eq } from "drizzle-orm";

import { ImportResult } from "../../types";
import { db } from "../../config/database";
import { warehouses } from "../../infrastructure/db/schema";

interface WarehouseCsvRow {
  name?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  active?: string;
}

export default async function importWarehouses(
  buffer: Buffer,
  userId: string
): Promise<ImportResult & { existing: number }> {
  const rows: WarehouseCsvRow[] = [];

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row: WarehouseCsvRow) => rows.push(row))
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

      const name = r.name?.trim();
      const address = r.address?.trim();

      if (
        !name ||
        !address ||
        r.latitude === undefined ||
        r.longitude === undefined
      ) {
        failed++;
        errors.push({
          row: i + 1,
          reason:
            "Missing required fields (name, address, latitude, longitude)"
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

      const existingWarehouse = await tx
        .select({ id: warehouses.id })
        .from(warehouses)
        .where(eq(warehouses.name, name))
        .limit(1);

      if (existingWarehouse.length > 0) {
        existing++;
        continue;
      }

      try {
        await tx.insert(warehouses).values({
          name,
          address,
          latitude,
          longitude,
          active: r.active !== undefined ? (r.active.trim().toLowerCase() === "true" || r.active.trim().toLowerCase() === "active") : true,
        });

        inserted++;
      } catch (e: any) {
        failed++;
        errors.push({
          row: i + 1,
          reason: e.message ?? "Unknown error"
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
