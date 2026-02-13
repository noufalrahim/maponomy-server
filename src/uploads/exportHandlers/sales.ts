import { Response } from "express";
import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "../../config/database";
import { salespersons, users } from "../../infrastructure/db/schema";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function exportSales(
  res: Response,
  fromDate: string,
  toDate: string
) {
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const to = new Date(`${toDate}T23:59:59.999Z`);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales.csv"
  );

  res.write(
    "email,role,name,phone_number,monthly_target,active,created_at\n"
  );

  const rows = await db
    .select({
      email: users.email,
      role: users.role,
      name: salespersons.name,
      phoneNumber: salespersons.phoneNumber,
      monthlyTarget: salespersons.monthlyTarget,
      active: salespersons.active,
      createdAt: salespersons.createdAt,
    })
    .from(salespersons)
    .innerJoin(users, eq(salespersons.userId, users.id))
    .where(
      and(
        gte(salespersons.createdAt, from),
        lte(salespersons.createdAt, to)
      )
    );

  for (const r of rows) {
    res.write(
      [
        csvEscape(r.email),
        csvEscape(r.role),
        csvEscape(r.name),
        csvEscape(r.phoneNumber),
        csvEscape(r.monthlyTarget),
        csvEscape(r.active),
        csvEscape(r.createdAt.toISOString()),
      ].join(",") + "\n"
    );
  }

  res.end();
}
