import { Response } from "express";
import { db } from "../../config/database";
import { warehouses } from "../../infrastructure/db/schema";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function exportWarehouses(res: Response) {
  const rows = await db.select().from(warehouses);

  // Headers are already set by the ExportController

  try {
    res.write("id,name,address,latitude,longitude,active\n");

    for (const w of rows) {
      res.write(
        [
          csvEscape(w.id),
          csvEscape(w.name),
          csvEscape(w.address),
          csvEscape(w.latitude),
          csvEscape(w.longitude),
          csvEscape(w.active),
        ].join(",") + "\n"
      );
    }
  } finally {
    res.end();
  }
}
