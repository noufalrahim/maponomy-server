import { Response } from "express";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";
import { db } from "../../config/database";
import {
  orders,
  users,
  vendors,
  warehouses,
} from "../../infrastructure/db/schema";

const vendorWarehouses = aliasedTable(warehouses, "vendor_warehouses");

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function exportOrders(
  res: Response,
  fromDate: string,
  toDate: string
) {
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const to = new Date(`${toDate}T23:59:59.999Z`);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=orders.csv"
  );

  res.write(
    "order_id,order_customer_id,order_warehouse_id,delivery_date,delivery_start_time,delivery_end_time,order_status,total_amount,order_created_by,order_created_at,order_updated_at,pushed_to_erp,creator_email,customer_id,customer_name,customer_user_id,customer_store_image,customer_latitude,customer_longitude,customer_address,customer_phone_number,customer_type,warehouse_id,warehouse_name,warehouse_address,warehouse_latitude,warehouse_longitude\n"
  );

  const rows = await db
    .select({
      orderId: orders.id,
      orderCustomerId: orders.vendorId,
      orderWarehouseId: orders.warehouseId,
      deliveryDate: orders.deliveryDate,
      deliveryStartTime: orders.deliveryStartTime,
      deliveryEndTime: orders.deliveryEndTime,
      orderStatus: orders.status,
      totalAmount: orders.totalAmount,
      orderCreatedBy: orders.createdBy,
      orderCreatedAt: orders.createdAt,
      orderUpdatedAt: orders.updatedAt,
      pushedToErp: orders.pushedToErp,

      creatorEmail: users.email,

      customerId: vendors.id,
      customerName: vendors.name,
      customerUserId: vendors.userId,
      customerStoreImage: vendors.storeImage,
      customerLatitude: vendors.latitude,
      customerLongitude: vendors.longitude,
      customerAddress: vendors.address,
    customerPhoneNumber: vendors.phoneNumber,
      customerType: vendors.type,

      warehouseId: sql<string>`COALESCE(${warehouses.id}, ${vendorWarehouses.id})`,
      warehouseName: sql<string>`COALESCE(${warehouses.name}, ${vendorWarehouses.name})`,
      warehouseAddress: sql<string>`COALESCE(${warehouses.address}, ${vendorWarehouses.address})`,
      warehouseLatitude: sql<number>`COALESCE(${warehouses.latitude}, ${vendorWarehouses.latitude})`,
      warehouseLongitude: sql<number>`COALESCE(${warehouses.longitude}, ${vendorWarehouses.longitude})`,
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .innerJoin(users, eq(orders.createdBy, users.id))
    .leftJoin(warehouses, eq(orders.warehouseId, warehouses.id))
    .leftJoin(vendorWarehouses, eq(vendorWarehouses.id, vendors.warehouseId))
    .where(and(gte(orders.createdAt, from), lte(orders.createdAt, to)));

  for (const r of rows) {
    res.write(
      [
        csvEscape(r.orderId),
        csvEscape(r.orderCustomerId),
        csvEscape(r.orderWarehouseId),
        csvEscape(r.deliveryDate),
        csvEscape(r.deliveryStartTime),
        csvEscape(r.deliveryEndTime),
        csvEscape(r.orderStatus),
        csvEscape(r.totalAmount),
        csvEscape(r.orderCreatedBy),
        csvEscape(r.orderCreatedAt.toISOString()),
        csvEscape(r.orderUpdatedAt.toISOString()),
        r.pushedToErp ? "Yes" : "No",

        csvEscape(r.creatorEmail),

        csvEscape(r.customerId),
        csvEscape(r.customerName),
        csvEscape(r.customerUserId),
        csvEscape(r.customerStoreImage),
        csvEscape(r.customerLatitude),
        csvEscape(r.customerLongitude),
        csvEscape(r.customerAddress),
        csvEscape(r.customerPhoneNumber),
        csvEscape(r.customerType),

        csvEscape(r.warehouseId),
        csvEscape(r.warehouseName),
        csvEscape(r.warehouseAddress),
        csvEscape(r.warehouseLatitude),
        csvEscape(r.warehouseLongitude),
      ].join(",") + "\n"
    );
  }

  res.end();
}
