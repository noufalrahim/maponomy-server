import exportProducts from "./products";
import exportSales from "./sales";
import exportVendors from "./vendors";
import exportWarehouses from "./warehouses";


const exportHandlers: Record<string, (res: any) => Promise<void>> = {
  Products: exportProducts,
  Warehouses: exportWarehouses,
  Sales: exportSales,
  Customers: exportVendors
};

export default exportHandlers;
