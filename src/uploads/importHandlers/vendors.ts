import fs from "fs";
import csv from "csv-parser";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { ImportResult, Role } from "../../types";
import { db } from "../../config/database";
import { users, vendors } from "../../infrastructure/db/schema";

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
}

export default async function importVendors(
  filePath: string
): Promise<ImportResult & { existing: number }> {
  const rows: VendorCsvRow[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
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
      const r = rows[i];

      const name = r.name?.trim();
      const address = r.address?.trim();
      const phoneNumber = r.phone_number?.trim();
      const email = r.email?.trim();
      const password = r.password?.trim();

      if (!name || !address || !phoneNumber || !email || !password) {
        failed++;
        errors.push({
          row: i + 1,
          reason:
            "Missing required fields (name, address, phone_number, email, password)"
        });
        continue;
      }

      const latitude = r.latitude ? Number(r.latitude) : 0;
      const longitude = r.longitude ? Number(r.longitude) : 0;

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        failed++;
        errors.push({
          row: i + 1,
          reason: "Latitude or longitude is not a valid number"
        });
        continue;
      }

      const existingUser = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const existingVendor = await tx
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
        continue;
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [user] = await tx
          .insert(users)
          .values({
            email,
            password: hashedPassword,
            role: Role.CUSTOMER,
            isActive: true
          })
          .returning({ id: users.id });

        await tx.insert(vendors).values({
          userId: user.id,
          name,
          address,
          phoneNumber,
          warehouseId: r.warehouse_id ?? null,
          latitude,
          longitude,
          storeImage: r.store_image?.trim() || "",
          type: r.type ?? "external",
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
    existing,
    errors
  };
}
