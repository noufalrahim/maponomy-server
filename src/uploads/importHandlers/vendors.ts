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
            if (h === "lat" || h === "latitude" || h === "latitutde" || h === "lattitude") return "latitude";
            if (h === "lng" || h === "long" || h === "longitude" || h === "longitutde" || h === "longtitude")
              return "longitude";
            if (
              h === "phone" ||
              h === "phoneno" ||
              h === "phone_number" ||
              h === "phone number" ||
              h === "mobile" ||
              h === "contact"
            )
              return "phone_number";
            if (h === "email" || h === "email_address" || h === "email address")
              return "email";
            if (h === "name" || h === "customer_name" || h === "customer name" || h === "store name" || h === "store_name" || h === "vendor name")
              return "name";
            if (h === "address" || h === "customer_address" || h === "customer address" || h === "location" || h === "geo_address")
              return "address";
            if (h === "salesperson" || h === "salesperson_id" || h === "salespersonid" || h === "sales_rep")
              return "salespersonid";
            if (h === "warehouse" || h === "warehouse_id" || h === "warehouseid")
              return "warehouse_id";
            if (h === "type" || h === "vendor_type" || h === "customer_type")
              return "type";
            if (h === "password" || h === "pass")
              return "password";
            if (h === "active" || h === "is_active")
              return "active";
            if (h === "image" || h === "store_image" || h === "logo")
              return "store_image";
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
        let latitude: number | undefined;
        let longitude: number | undefined;
        
        const parseCoord = (v: any) => {
          if (v === undefined || v === null || v === "") return undefined;
          const s = String(v).trim();
          if (s === "") return undefined;
          const parsed = parseFloat(s.replace(/[^\d.-]/g, ''));
          return isNaN(parsed) ? null : parsed;
        };

        const rawLat = parseCoord(r.latitude);
        const rawLong = parseCoord(r.longitude);

        if (rawLat === null || rawLong === null) {
          failed++;
          errors.push({
            row: i + 1,
            reason: `Invalid latitude or longitude format: ${r.latitude}, ${r.longitude}`,
          });
          return;
        }

        latitude = rawLat;
        longitude = rawLong;

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
          const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
          let targetVendorId: string | null = null;
          let targetUserId: string | null = null;
          let isUpdate = false;

          // Strategy: find existing vendor first (by phone or by user email)
          if (foundVendor) {
            targetVendorId = foundVendor.id;
            targetUserId = foundVendor.userId;
            isUpdate = true;
          } else if (foundUser) {
            targetUserId = foundUser.id;
            // Check if this user has a vendor profile
            const [v] = await trx
              .select({ id: vendors.id })
              .from(vendors)
              .where(eq(vendors.userId, targetUserId))
              .limit(1);
            if (v) {
              targetVendorId = v.id;
              isUpdate = true;
            }
          }

          if (isUpdate && targetUserId) {
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

            if (targetVendorId) {
              // Update existing vendor
              const vendorUpdateData: any = {
                name,
                address,
                phoneNumber,
                warehouseId: normalize(r.warehouse_id),
                storeImage: normalize(r.store_image),
                type: normalize(r.type) ?? "external",
                active:
                  r.active !== undefined
                    ? r.active.trim().toLowerCase() === "true" ||
                    r.active.trim().toLowerCase() === "active"
                    : true,
              };

              // Only update coordinates if they are provided in CSV
              if (latitude !== undefined) vendorUpdateData.latitude = latitude;
              if (longitude !== undefined) vendorUpdateData.longitude = longitude;

              await trx
                .update(vendors)
                .set(vendorUpdateData)
                .where(eq(vendors.id, targetVendorId));
            } else {
              // User exists but has no vendor profile, create one
              // Coordinates are required for new profiles
              if (latitude === undefined || longitude === undefined) {
                failed++;
                errors.push({
                  row: i + 1,
                  reason: "Latitude and longitude are required for creating new customer profiles.",
                });
                return;
              }

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
            // New record - coordinates and password are required
            if (!password) {
              failed++;
              errors.push({
                row: i + 1,
                reason: "Password is required for new customer records",
              });
              return;
            }

            if (latitude === undefined || longitude === undefined) {
              failed++;
              errors.push({
                row: i + 1,
                reason: "Latitude and longitude are required for new customer records",
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
