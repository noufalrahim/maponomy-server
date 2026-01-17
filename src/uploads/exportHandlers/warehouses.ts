import { Response } from "express";
import { db } from "../../config/database";
import { warehouses } from "../../infrastructure/db/schema";

export default async function exportWarehouses(res: Response) {
  res.write("id,name,address,latitude,longitude,active\n");

  const rows = await db.select().from(warehouses);

  for (const w of rows) {
    res.write(
      `${w.id},${w.name},${w.address},${w.latitude},${w.longitude},${w.active}\n`
    );
  }

  res.end();
}
