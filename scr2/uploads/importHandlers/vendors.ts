import csv from "csv-parser";
import bcrypt from "bcryptjs";
import { Readable } from "stream";
import { eq, or } from "drizzle-orm";

import { ImportResult, Role } from "../../types";
import { db } from "../../config/database";
import {
  users,
  vendors,
  vendorSalespersons,
} from "../../infrastructure/db/schema";

interface VendorCsvRow {
  name?: string;
  address?: string;
  phone_number?: string;
  warehouse_id?: string;
  active?: string;
  type?: string;
  latitude?: string;
  longitude?: string;
  store_image?: string;
  email?: string;
  password?: string;
  salespersonid?: string;
}

const normalize = (v?: string) => v?.trim().toLowerCase() || null;

export default async function importVendors(
  buffer: Buffer
): Promise<ImportResult & { existing: number }> {
  const rows: VendorCsvRow[] = [];

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row: VendorCsvRow) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  let inserted = 0;
  let failed = 0;
  let existing = 0;

  const errors: ImportResult["errors"] = [];

  await db.transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      await tx.transaction(async (trx) => {
        const r = rows[i];

        const name = normalize(r.name);
        const address = normalize(r.address);
        const phoneNumber = normalize(r.phone_number);
        const email = normalize(r.email);
        const password = r.password?.trim() || null;
        const salespersonId = r.salespersonid?.trim() || null;

        if (!name || !address || !phoneNumber || !email || !password) {
          failed++;
          errors.push({
            row: i + 1,
            reason:
              "Missing required fields (name, address, phone_number, email, password)",
          });
          return;
        }

        const latitude = r.latitude ? Number(r.latitude) : 0;
        const longitude = r.longitude ? Number(r.longitude) : 0;

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
          failed++;
          errors.push({
            row: i + 1,
            reason: "Latitude or longitude is not a valid number",
          });
          return;
        }

        const existingUser = await trx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const existingVendor = await trx
          .select({ id: vendors.id })
          .from(vendors)
          .where(
            or(
              eq(vendors.name, name),
              eq(vendors.phoneNumber, phoneNumber)
            )
          )
          .limit(1);

        if (existingUser.length > 0 || existingVendor.length > 0) {
          existing++;
          return;
        }

        try {
          const hashedPassword = await bcrypt.hash(password, 10);

          const [user] = await trx
            .insert(users)
            .values({
              email,
              password: hashedPassword,
              role: Role.CUSTOMER,
              isActive: true,
            })
            .returning({ id: users.id });

          const [vendor] = await trx
            .insert(vendors)
            .values({
              userId: user.id,
              name,
              address,
              phoneNumber,
              warehouseId: normalize(r.warehouse_id),
              latitude,
              longitude,
              storeImage: normalize(r.store_image),
              type: normalize(r.type) ?? "external",
              active:
                r.active !== undefined
                  ? r.active.trim().toLowerCase() === "true" ||
                    r.active.trim().toLowerCase() === "active"
                  : true,
            })
            .returning({ id: vendors.id });

          if (salespersonId) {
            await trx.insert(vendorSalespersons).values({
              vendorId: vendor.id,
              salespersonId,
            });
          }

          inserted++;
        } catch (e: any) {
          console.error("Vendor import DB error:", e);
          failed++;
          errors.push({
            row: i + 1,
            reason: e.message ?? "Database error",
          });
        }
      });
    }
  });

  return {
    total: rows.length,
    inserted,
    failed,
    existing,
    errors,
  };
}
