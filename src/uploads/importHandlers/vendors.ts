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
  buffer: Buffer,
  userId: string
): Promise<ImportResult & { existing: number }> {
  const rows: VendorCsvRow[] = [];

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(
        csv({
          mapHeaders: ({ header }) => {
            const h = header.toLowerCase().trim();
            if (h === "lat" || h === "latitude") return "latitude";
            if (h === "lng" || h === "long" || h === "longitude")
              return "longitude";
            if (
              h === "phone" ||
              h === "phoneno" ||
              h === "phone_number" ||
              h === "phone number"
            )
              return "phone_number";
            if (h === "email" || h === "email_address" || h === "email address")
              return "email";
            if (h === "name" || h === "customer_name" || h === "customer name")
              return "name";
            if (h === "address" || h === "customer_address" || h === "customer address")
              return "address";
            return h.replace(/\s+/g, "_");
          },
        })
      )
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

        const name = r.name?.trim() || null;
        const address = r.address?.trim() || null;
        const phoneNumber = r.phone_number?.trim() || null;
        const email = normalize(r.email);
        const password = r.password?.trim() || null;
        const salespersonId = r.salespersonid?.trim() || null;

        if (!name || !address || !phoneNumber || !email) {
          failed++;
          errors.push({
            row: i + 1,
            reason:
              "Missing required fields (name, address, phone_number, email)",
          });
          return;
        }

        // Parse latitude and longitude more robustly
        let latitude = 0;
        let longitude = 0;
        
        if (r.latitude !== undefined && r.latitude !== null && r.latitude !== "") {
          latitude = parseFloat(String(r.latitude).replace(/[^\d.-]/g, ''));
        }
        if (r.longitude !== undefined && r.longitude !== null && r.longitude !== "") {
          longitude = parseFloat(String(r.longitude).replace(/[^\d.-]/g, ''));
        }

        if (isNaN(latitude) || isNaN(longitude)) {
          failed++;
          errors.push({
            row: i + 1,
            reason: `Invalid latitude or longitude format: ${r.latitude}, ${r.longitude}`,
          });
          return;
        }

        // Check for existing user by email
        const [foundUser] = await trx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Check for existing vendor by phone number (since email is checked via user)
        const [foundVendor] = await trx
          .select({ id: vendors.id, userId: vendors.userId })
          .from(vendors)
          .where(eq(vendors.phoneNumber, phoneNumber))
          .limit(1);

        try {
          let hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
          let targetUserId: string;
          let targetVendorId: string | null = null;
          let isUpdate = false;

          if (foundUser || foundVendor) {
            isUpdate = true;
            targetUserId = foundUser ? foundUser.id : foundVendor!.userId;
            
            // Update User
            const userUpdateData: any = {
              email,
              isActive: true,
            };
            if (hashedPassword) {
              userUpdateData.password = hashedPassword;
            }

            await trx
              .update(users)
              .set(userUpdateData)
              .where(eq(users.id, targetUserId));

            // Find Vendor if not already found
            if (foundVendor && foundVendor.userId === targetUserId) {
              targetVendorId = foundVendor.id;
            } else {
              const [v] = await trx
                .select({ id: vendors.id })
                .from(vendors)
                .where(eq(vendors.userId, targetUserId))
                .limit(1);
              if (v) targetVendorId = v.id;
            }

            if (targetVendorId) {
              // Update existing vendor
              await trx
                .update(vendors)
                .set({
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
                .where(eq(vendors.id, targetVendorId));
            } else {
              // User exists but has no vendor profile, create one
              const [vendor] = await trx
                .insert(vendors)
                .values({
                  userId: targetUserId,
                  name,
                  address,
                  phoneNumber,
                  warehouseId: normalize(r.warehouse_id),
                  latitude,
                  longitude,
                  storeImage: normalize(r.store_image),
                  type: normalize(r.type) ?? "external",
                  active: true,
                })
                .returning({ id: vendors.id });
              targetVendorId = vendor.id;
            }
            
            existing++;
          } else {
            // New record - password is required for new records
            if (!password) {
              failed++;
              errors.push({
                row: i + 1,
                reason: "Password is required for new customer records",
              });
              return;
            }

            const [user] = await trx
              .insert(users)
              .values({
                email,
                password: hashedPassword!,
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
            
            targetVendorId = vendor.id;
            inserted++;
          }

          // Handle salesperson association (only if salespersonId provided)
          if (salespersonId && targetVendorId) {
            // First check if association already exists to avoid unique constraint error
            const [existingAssoc] = await trx
              .select()
              .from(vendorSalespersons)
              .where(eq(vendorSalespersons.vendorId, targetVendorId))
              .limit(1); // Assuming 1:1 or just updating to the provided one

            if (existingAssoc) {
              await trx
                .update(vendorSalespersons)
                .set({ salespersonId })
                .where(eq(vendorSalespersons.vendorId, targetVendorId));
            } else {
              await trx.insert(vendorSalespersons).values({
                vendorId: targetVendorId,
                salespersonId,
              });
            }
          }
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
