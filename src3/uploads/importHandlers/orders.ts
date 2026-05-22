import csv from "csv-parser";
import { Readable } from "stream";

import { ImportResult } from "../../types";
import { db } from "../../config/database";
import { orders, orderItems, products } from "../../infrastructure/db/schema";
import { eq, inArray } from "drizzle-orm";
import { OrderStatus } from "../../types/enums";

interface OrderCsvRow {
    vendor_id?: string;
    warehouse_id?: string;
    delivery_date?: string;
    start_time?: string;
    end_time?: string;
    product_id?: string;
    quantity?: string;
    status?: string;
}

export default async function importOrders(
    buffer: Buffer,
    userId: string
): Promise<ImportResult & { existing: number }> {
    const rows: OrderCsvRow[] = [];

    await new Promise<void>((resolve, reject) => {
        Readable.from(buffer)
            .pipe(csv())
            .on("data", (row: OrderCsvRow) => rows.push(row))
            .on("end", resolve)
            .on("error", reject);
    });

    let inserted = 0;
    let failed = 0;
    const existing = 0; // Keeping track of existing for interface compliance

    const errors: ImportResult["errors"] = [];

    type OrderGroup = {
        vendorId: string;
        warehouseId: string | null;
        deliveryDate: string;
        startTime: string;
        endTime: string;
        totalAmount: number;
        items: {
            productId: string;
            quantity: number;
            amount: number;
            originalRowIndex: number;
        }[];
    };

    const groups = new Map<string, OrderGroup>();

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const vendorId = r.vendor_id?.trim();
        const warehouseId = r.warehouse_id?.trim() || null;
        const deliveryDate = r.delivery_date?.trim();
        const startTime = r.start_time?.trim();
        const endTime = r.end_time?.trim();
        const productId = r.product_id?.trim();
        const quantityStr = r.quantity?.trim();

        if (!vendorId || !deliveryDate || !startTime || !endTime || !productId || !quantityStr) {
            failed++;
            errors.push({
                row: i + 1,
                reason: "Missing required fields (vendor_id, delivery_date, start_time, end_time, product_id, quantity)"
            });
            continue;
        }

        const quantity = parseInt(quantityStr, 10);

        if (isNaN(quantity)) {
            failed++;
            errors.push({
                row: i + 1,
                reason: "Quantity is not a valid number"
            });
            continue;
        }

        // Creating a unique key to group order items
        const groupKey = `${vendorId}_${warehouseId}_${deliveryDate}_${startTime}_${endTime}`;

        if (!groups.has(groupKey)) {
            groups.set(groupKey, {
                vendorId,
                warehouseId,
                deliveryDate,
                startTime,
                endTime,
                totalAmount: 0,
                items: []
            });
        }

        const group = groups.get(groupKey)!;
        group.items.push({
            productId,
            quantity,
            amount: 0, // Will be calculated after fetching prices
            originalRowIndex: i + 1
        });
    }

    // Fetch product prices
    const uniqueProductIds = Array.from(new Set(
        Array.from(groups.values()).flatMap(g => g.items.map(i => i.productId))
    ));

    const productPrices = new Map<string, number>();

    if (uniqueProductIds.length > 0) {
        const dbProducts = await db
            .select({ id: products.id, price: products.price })
            .from(products)
            .where(inArray(products.id, uniqueProductIds));

        for (const p of dbProducts) {
            productPrices.set(p.id, parseFloat(p.price));
        }
    }

    // Calculate amounts and total amounts
    for (const [groupKey, group] of groups.entries()) {
        let allProductsFound = true;
        for (const item of group.items) {
            const price = productPrices.get(item.productId);
            if (price === undefined) {
                failed++;
                errors.push({
                    row: item.originalRowIndex,
                    reason: `Product with ID ${item.productId} not found`
                });
                allProductsFound = false;
            } else {
                item.amount = price * item.quantity;
                group.totalAmount += item.amount;
            }
        }

        // If any product in the group was not found, we don't process this order group
        if (!allProductsFound) {
            groups.delete(groupKey);
        }
    }

    await db.transaction(async (tx) => {
        for (const [, group] of groups.entries()) {
            try {
                await tx.transaction(async (innerTx) => {
                    const [order] = await innerTx.insert(orders).values({
                        vendorId: group.vendorId,
                        warehouseId: group.warehouseId,
                        deliveryDate: group.deliveryDate,
                        deliveryStartTime: group.startTime,
                        deliveryEndTime: group.endTime,
                        status: OrderStatus.PENDING,
                        totalAmount: group.totalAmount.toString(),
                        createdBy: userId
                    }).returning({ id: orders.id });

                    for (const item of group.items) {
                        await innerTx.insert(orderItems).values({
                            orderId: order.id,
                            productId: item.productId,
                            quantity: item.quantity,
                            totalPrice: item.amount.toString()
                        });
                    }

                    inserted += group.items.length;
                });
            } catch (e: any) {
                console.error("Order import DB error:", e);
                for (const item of group.items) {
                    failed++;
                    errors.push({
                        row: item.originalRowIndex,
                        reason: e.message ?? "Database error during order creation"
                    });
                }
            }
        }
    });

    return {
        total: rows.length,
        inserted,
        failed,
        existing,
        errors
    };
}
