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
      .pipe(csv({
        mapHeaders: ({ header }) => {
          const h = header.toLowerCase().trim();
          if (h === "lat" || h === "latitude" || h === "latitutde" || h === "lattitude") return "latitude";
          if (h === "lng" || h === "long" || h === "longitude" || h === "longitutde" || h === "longtitude")
            return "longitude";
          if (h === "name" || h === "warehouse_name" || h === "warehouse name")
            return "name";
          if (h === "address" || h === "warehouse_address" || h === "warehouse address" || h === "location")
            return "address";
          if (h === "active" || h === "is_active")
            return "active";
          return h.replace(/\s+/g, "_");
        },
      }))
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

      if (!name || !address) {
        failed++;
        errors.push({
          row: i + 1,
          reason: "Missing required fields (name, address)"
        });
        continue;
      }

      const parseCoord = (v: any) => {
        if (v === undefined || v === null || v === "") return undefined;
        const s = String(v).trim();
        if (s === "") return undefined;
        const parsed = parseFloat(s.replace(/[^\d.-]/g, ''));
        return isNaN(parsed) ? null : parsed;
      };

      const latitude = parseCoord(r.latitude);
      const longitude = parseCoord(r.longitude);

      if (latitude === null || longitude === null) {
        failed++;
        errors.push({
          row: i + 1,
          reason: "Latitude or longitude is not a valid number"
        });
        continue;
      }

      const [existingWarehouse] = await tx
        .select({ id: warehouses.id })
        .from(warehouses)
        .where(eq(warehouses.name, name))
        .limit(1);

      if (existingWarehouse) {
        const updateData: any = {
          address,
          active:
            r.active !== undefined
              ? r.active.trim().toLowerCase() === "true" ||
              r.active.trim().toLowerCase() === "active"
              : true,
        };

        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;

        await tx
          .update(warehouses)
          .set(updateData)
          .where(eq(warehouses.id, existingWarehouse.id));
        
        existing++;
      } else {
        // New Record - Coordinates are required
        if (latitude === undefined || longitude === undefined) {
          failed++;
          errors.push({
            row: i + 1,
            reason: "Latitude and longitude are required for new warehouses"
          });
          continue;
        }

        try {
          await tx.insert(warehouses).values({
            name,
            address,
            latitude,
            longitude,
            active:
              r.active !== undefined
                ? r.active.trim().toLowerCase() === "true" ||
                r.active.trim().toLowerCase() === "active"
                : true,
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
