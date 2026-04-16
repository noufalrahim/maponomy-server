import { db } from "./src/config/database";
import { warehouses, salespersons } from "./src/infrastructure/db/schema";
import { eq } from "drizzle-orm";

async function fetchIds() {
  try {
    const warehouseList = await db.select({ id: warehouses.id, name: warehouses.name }).from(warehouses).limit(5);
    const salespersonList = await db.select({ id: salespersons.id, name: salespersons.name }).from(salespersons).limit(5);

    console.log("--- WAREHOUSES ---");
    console.log(JSON.stringify(warehouseList, null, 2));
    console.log("--- SALESPERSONS ---");
    console.log(JSON.stringify(salespersonList, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error fetching IDs:", error);
    process.exit(1);
  }
}

fetchIds();
