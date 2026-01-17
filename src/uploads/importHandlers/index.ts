// src/importHandlers/index.ts
import importSalespersons from "../importHandlers/salespersons";
import importProducts from "./products";
import importVendors from "./vendors";
import importWarehouses from "./warehouses";


const importHandlers: Record<
  string,
  (filePath: string) => Promise<{
    total: number;
    inserted: number;
    failed: number;
    errors: { row: number; reason: string }[];
  }>
> = {
  Sales: importSalespersons,
  Customers: importVendors,
  Warehouses: importWarehouses,
  Products: importProducts,
};

export default importHandlers;
