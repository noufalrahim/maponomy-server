import fs from "fs";
import csv from "csv-parser";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { ImportResult } from "../../types";
import { db } from "../../config/database";
import { salespersons, users } from "../../infrastructure/db/schema";

interface SalespersonCsvRow {
  email?: string;
  password?: string;
  role?: string;
  name?: string;
  phone_number?: string;
  monthly_target?: string;
  active?: string;
}

export default async function importSalespersons(
  filePath: string
): Promise<ImportResult & { existing: number }> {
  const rows: SalespersonCsvRow[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: SalespersonCsvRow) => rows.push(row))
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

      const email = r.email?.trim();
      const password = r.password?.trim();
      const name = r.name?.trim();
      const phoneNumber = r.phone_number?.trim();

      if (!email || !password || !name || !phoneNumber) {
        failed++;
        errors.push({
          row: i + 1,
          reason: "Missing required fields (email, password, name, phone_number)"
        });
        continue;
      }

      const existingUser = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        existing++;
        continue;
      }

      const existingSalesperson = await tx
        .select({ id: salespersons.id })
        .from(salespersons)
        .where(eq(salespersons.name, name))
        .limit(1);

      if (existingSalesperson.length > 0) {
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
            role: r.role ?? "user",
            isActive: true
          })
          .returning({ id: users.id });

        await tx.insert(salespersons).values({
          userId: user.id,
          name,
          phoneNumber,
          monthlyTarget: r.monthly_target
            ? Number(r.monthly_target)
            : 0,
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
