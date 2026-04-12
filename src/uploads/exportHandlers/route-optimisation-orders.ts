import { Response } from "express";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../config/database";
import {
  orders,
  vendors,
  products,
  orderItems,
  warehouses,
} from "../../infrastructure/db/schema";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function convertTo24Hour(timeStr: string): string {
  if (!timeStr) return "";
  
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr; // Return as is if it doesn't match 12-hour format

  let [_, hours, minutes, modifier] = match;
  let h = parseInt(hours, 10);

  if (modifier.toUpperCase() === "PM" && h < 12) {
    h += 12;
  } else if (modifier.toUpperCase() === "AM" && h === 12) {
    h = 0;
  }

  const hh = h < 10 ? `0${h}` : `${h}`;
  return `${hh}:${minutes}`;
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
    "id,order_id,warehouse_id,warehouse_name,wbn,item_name,quantity,price,destination_name,address,service_time_mins,package_weight_kg,lat,lon,opening_hour,closing_hour,date,type,contact,secondary_contact,dimension_unit,dimension_length,dimension_width,dimension_height\n"
  );

  const rows = await db
    .select({
      id: orderItems.id,
      orderId: orders.id,
      warehouseId: vendors.warehouseId,
      warehouseName: warehouses.name,
      itemName: products.name,
      itemQuantity: orderItems.quantity,
      itemPrice: sql<string>`(${orderItems.totalPrice} / ${orderItems.quantity})`,

      destinationName: vendors.address,
      address: vendors.address,

      serviceTimeMins: orderItems.serviceTime,

      lat: vendors.latitude,
      lon: vendors.longitude,

      openingHour: orders.deliveryStartTime,
      closingHour: orders.deliveryEndTime,
      date: orders.deliveryDate,

      contact: vendors.phoneNumber,
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .leftJoin(warehouses, eq(vendors.warehouseId, warehouses.id))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(and(gte(orders.deliveryDate, fromDate), lte(orders.deliveryDate, toDate)));

  for (const r of rows) {
    res.write(
      [
        csvEscape(r.id),
        csvEscape(r.orderId),
        csvEscape(r.warehouseId),
        csvEscape(r.warehouseName),
        "",
        csvEscape(r.itemName),
        csvEscape(r.itemQuantity),
        csvEscape(r.itemPrice),
        csvEscape(r.destinationName),
        csvEscape(r.address),
        csvEscape(r.serviceTimeMins),
        "",
        csvEscape(r.lat),
        csvEscape(r.lon),
        csvEscape(convertTo24Hour(r.openingHour)),
        csvEscape(convertTo24Hour(r.closingHour)),
        csvEscape(r.date),
        "delivery",
        csvEscape(r.contact),
        "",
        "",
        "",
        "",
        "",
      ].join(",") + "\n"
    );
  }

  res.end();
}
