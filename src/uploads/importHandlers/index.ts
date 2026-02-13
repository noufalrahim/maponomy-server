import importSalespersons from "./salespersons";
import importProducts from "./products";
import importVendors from "./vendors";
import importWarehouses from "./warehouses";

export type ImportResult = {
  total: number;
  inserted: number;
  failed: number;
  errors: { row: number; reason: string }[];
};

export type ImportHandler = (buffer: Buffer) => Promise<ImportResult>;

const importHandlers: Record<string, ImportHandler> = {
  Sales: importSalespersons,
  Customers: importVendors,
  Warehouses: importWarehouses,
  Products: importProducts
};

export default importHandlers;
