import { Response } from "express";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../config/database";
import {
  orders,
  vendors,
  products,
  orderItems,
} from "../../infrastructure/db/schema";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function exportRouteOptimisationOrders(
  res: Response,
  fromDate: string,
  toDate: string
) {
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const to = new Date(`${toDate}T23:59:59.999Z`);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=route_optimisation_orders.csv"
  );

  res.write(
    "id,warehouse_id,wbn,item_name,sku,destination_name,address,service_time_mins,package_weight_kg,lat,lon,opening_hour,closing_hour,date,type,contact,secondary_contact,dimension_unit,dimension_length,dimension_width,dimension_height,quantity\n"
  );

  const rows = await db
    .select({
      orderId: orders.id,
      warehouseId: vendors.warehouseId,
      itemName: products.name,
      sku: products.sku,

      destinationName: vendors.address,
      address: vendors.address,

      serviceTimeMins: sql<number>`
        EXTRACT(EPOCH FROM (${orders.deliveryDate} - ${orders.createdAt})) / 60
      `,

      lat: vendors.latitude,
      lon: vendors.longitude,

      openingHour: orders.deliveryStartTime,
      closingHour: orders.deliveryEndTime,
      date: orders.deliveryDate,

      contact: vendors.phoneNumber,
      quantity: products.measureUnit
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(and(gte(orders.createdAt, from), lte(orders.createdAt, to)));

  for (const r of rows) {
    res.write(
      [
        csvEscape(r.orderId),
        csvEscape(r.warehouseId),
        "",
        csvEscape(r.itemName),
        csvEscape(r.sku),
        csvEscape(r.destinationName),
        csvEscape(r.address),
        csvEscape(Math.round(r.serviceTimeMins)),
        "",
        csvEscape(r.lat),
        csvEscape(r.lon),
        csvEscape(r.openingHour),
        csvEscape(r.closingHour),
        csvEscape(r.date),
        "delivery",
        csvEscape(r.contact),
        "",
        "",
        "",
        "",
        "",
        csvEscape(r.quantity)
      ].join(",") + "\n"
    );
  }

  res.end();
}
