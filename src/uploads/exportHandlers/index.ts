import exportProducts from "./products";
import exportSales from "./sales";
import exportVendors from "./vendors";
import exportWarehouses from "./warehouses";
import exportOrders from "./orders";
import exportRouteOptimisationOrders from "./route-optimisation-orders";

type ExportHandler =
  | ((res: any) => Promise<void>)
  | ((res: any, from: string, to: string) => Promise<void>);

const exportHandlers: Record<string, ExportHandler> = {
  products: exportProducts,
  warehouses: exportWarehouses,
  sales: exportSales,
  customers: exportVendors,
  orders: exportOrders,
  routeOptimisationOrders: exportRouteOptimisationOrders,
};

export default exportHandlers;
