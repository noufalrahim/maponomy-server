import { Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../../config/database";
import { salespersons, users } from "../../infrastructure/db/schema";

export default async function exportSales(res: Response) {
  // CSV header
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
      createdAt: salespersons.createdAt
    })
    .from(salespersons)
    .innerJoin(users, eq(salespersons.userId, users.id));

  for (const r of rows) {
    res.write(
      `${r.email},${r.role},${r.name},${r.phoneNumber},${r.monthlyTarget},${r.active},${r.createdAt.toISOString()}\n`
    );
  }

  res.end();
}
