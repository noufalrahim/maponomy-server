import { db } from "../../config/database";
import { OrderRecord, orders } from "../../infrastructure/db/schemas/order.schema";
import { vendors } from "../../infrastructure/db/schemas/vendor.schema";
import { warehouses } from "../../infrastructure/db/schemas/warehouse.schema";
import { salespersons } from "../../infrastructure/db/schemas/salesperson.schema";
import { and, desc, eq, or, SQL, sql, aliasedTable } from "drizzle-orm";
import { BaseModel } from "./base/base.model";
import { OrderStatus } from "../../types";
import { orderItems, products, vendorSalespersons } from "../../infrastructure/db/schema";
import { OrderItemsModel } from "./order-items.model";
import { CreateOrderRequestDTO, UpdateOrderRequestDTO } from "../dto/RequestDTO/OrderRequestDTO";
import { OrderResponseDTO, OrdersBySalespersonResponseDTO } from "../dto/ResponseDTO/OrderResponseDTO";
import { BaseFindOptions } from "../service/base/base.service";

const vendorWarehouses = aliasedTable(warehouses, "vendor_warehouses");

export class OrderModel extends BaseModel<
  typeof orders.$inferSelect,
  typeof orders.$inferInsert
> {
  protected readonly table = orders;

  async createOrder(data: CreateOrderRequestDTO): Promise<OrderRecord> {
    return await db.transaction(async (tx) => {
      const orderItemsModel = new OrderItemsModel().withTransaction(tx);

      const deliveryDate =
        data.deliveryDate instanceof Date
          ? data.deliveryDate
          : new Date(data.deliveryDate);

      if (Number.isNaN(deliveryDate.getTime())) {
        throw new Error("Invalid delivery date");
      }

      let totalAmount = 0;
      for (const item of data.orderItems) {
        totalAmount += item.quantity * item.unitPrice;
      }

      const [orderRecord] = await tx
        .insert(orders)
        .values({
          vendorId: data.vendorId,
          warehouseId: data.warehouseId,
          deliveryDate: deliveryDate.toISOString().split("T")[0],
          deliveryStartTime: data.deliveryStartTime,
          deliveryEndTime: data.deliveryEndTime,
          status: data.status,
          totalAmount: totalAmount.toFixed(2),
          createdBy: data.createdBy,
        })
        .returning();

      if (!orderRecord?.id) {
        throw new Error("Failed to create order");
      }

      const orderItems = data.orderItems.map(item => ({
        orderId: orderRecord.id,
        productId: item.productId,
        quantity: item.quantity,
        totalPrice: (item.quantity * item.unitPrice).toFixed(2),
      }));

      await orderItemsModel.create(orderItems);

      const productQtyPayload = data.orderItems.map(i => ({
        id: i.productId,
        qty: i.quantity,
      }));

      await tx.execute(sql`
  UPDATE ${products} AS p
  SET quantity_sold = p.quantity_sold + i.qty
  FROM jsonb_to_recordset(${JSON.stringify(productQtyPayload)}::jsonb)
       AS i(id uuid, qty numeric)
  WHERE p.id = i.id
`);

      return orderRecord;
    });
  }

  async bulkCreateOrders(
    data: CreateOrderRequestDTO[]
  ): Promise<OrderRecord[]> {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return await db.transaction(async (tx) => {
      const orderItemsModel = new OrderItemsModel().withTransaction(tx);
      const createdOrders: OrderRecord[] = [];

      for (const order of data) {
        const deliveryDate =
          order.deliveryDate instanceof Date
            ? order.deliveryDate
            : new Date(order.deliveryDate);

        if (Number.isNaN(deliveryDate.getTime())) {
          throw new Error("Invalid delivery date");
        }

        let totalAmount = 0;
        for (const item of order.orderItems) {
          totalAmount += item.quantity * item.unitPrice;
        }

        const [orderRecord] = await tx
          .insert(orders)
          .values({
            vendorId: order.vendorId,
            warehouseId: order.warehouseId,
            deliveryDate: deliveryDate.toISOString().split("T")[0],
            deliveryStartTime: order.deliveryStartTime,
            deliveryEndTime: order.deliveryEndTime,
            status: order.status,
            totalAmount: totalAmount.toFixed(2),
            createdBy: order.createdBy,
          })
          .returning();

        if (!orderRecord?.id) {
          throw new Error("Failed to create order");
        }

        createdOrders.push(orderRecord);

        const items = order.orderItems.map(item => ({
          orderId: orderRecord.id,
          productId: item.productId,
          quantity: item.quantity,
          totalPrice: (item.quantity * item.unitPrice).toFixed(2),
        }));

        await orderItemsModel.create(items);

        const productQtyPayload = order.orderItems.map(i => ({
          id: i.productId,
          qty: i.quantity,
        }));

        await tx.execute(sql`
        UPDATE ${products} AS p
        SET quantity_sold = p.quantity_sold + i.qty
        FROM jsonb_to_recordset(${JSON.stringify(productQtyPayload)}::jsonb)
             AS i(id uuid, qty numeric)
        WHERE p.id = i.id
      `);
      }

      return createdOrders;
    });
  }


  async findAllOrders(options: {
    where?: SQL;
    orderBy?: SQL | SQL[];
    limit?: number;
    offset?: number;
  } = {}) {
    let query = db
      .select({
        orderId: orders.id,
        deliveryDate: orders.deliveryDate,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        deliveryStartTime: orders.deliveryStartTime,
        deliveryEndTime: orders.deliveryEndTime,
        pushedToErp: orders.pushedToErp,
        vendor: {
          id: vendors.id,
          name: vendors.name,
        },

        warehouse: {
          id: sql<string>`COALESCE(${warehouses.id}, ${vendorWarehouses.id})`,
          name: sql<string>`COALESCE(${warehouses.name}, ${vendorWarehouses.name})`,
        },

        salesperson: {
          userId: salespersons.userId,
          name: salespersons.name,
        },

        orderItems: sql<
          {
            productId: string;
            productName: string;
            productPrice: number;
            quantity: number;
            totalPrice: number;
          }[]
        >`
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'productId', ${products.id},
              'productName', ${products.name},
              'productPrice', ${products.price},
              'quantity', ${orderItems.quantity},
              'totalPrice', ${orderItems.totalPrice}
            )
          ) FILTER (WHERE ${orderItems.id} IS NOT NULL),
          '[]'
        )
      `,

        orderItemsCount: sql<number>`
        COUNT(${orderItems.id})
      `,
      })
      .from(orders)
      .leftJoin(vendors, eq(vendors.id, orders.vendorId))
      .leftJoin(warehouses, eq(warehouses.id, orders.warehouseId))
      .leftJoin(vendorWarehouses, eq(vendorWarehouses.id, vendors.warehouseId))
      .leftJoin(salespersons, eq(salespersons.userId, orders.createdBy))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(products.id, orderItems.productId))
      .groupBy(
        orders.id,
        vendors.id,
        warehouses.id,
        vendorWarehouses.id,
        vendorWarehouses.name,
        salespersons.id
      );

    if (options.where) {
      (query as any) = query.where(options.where);
    }

    if (options.orderBy) {
      (query as any) = Array.isArray(options.orderBy)
        ? query.orderBy(...options.orderBy)
        : query.orderBy(options.orderBy);
    } else {
      (query as any) = query.orderBy(desc(orders.createdAt));
    }

    if (options.limit !== undefined) {
      (query as any) = query.limit(options.limit);
    }

    if (options.offset !== undefined) {
      (query as any) = query.offset(options.offset);
    }

    const rows = await query;

    return rows.map(row => ({
      id: row.orderId,
      customer: row.vendor ?? null,
      warehouse: row.warehouse ?? null,
      salesperson: row.salesperson ?? null,
      deliveryDate: row.deliveryDate,
      deliveryStartTime: row.deliveryStartTime,
      deliveryEndTime: row.deliveryEndTime,
      status: row.status as OrderStatus,
      totalAmount: row.totalAmount,
      orderItems: row.orderItems,
      pushedToErp: row.pushedToErp,
      orderItemsCount: Number(row.orderItemsCount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async countAllOrders(where?: SQL): Promise<number> {

    const query = db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .leftJoin(vendors, eq(vendors.id, orders.vendorId))
      .leftJoin(warehouses, eq(warehouses.id, orders.warehouseId))
      .leftJoin(salespersons, eq(salespersons.userId, orders.createdBy));

    if (where) {
      query.where(where);
    }

    const [{ count }] = await query;
    return Number(count);
  }


  async findAllOrdersBySalespersonId(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<OrdersBySalespersonResponseDTO[]> {
    let query = db
      .select({
        orderId: orders.id,
        deliveryDate: orders.deliveryDate,
        deliveryStartTime: orders.deliveryStartTime,
        deliveryEndTime: orders.deliveryEndTime,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,

        vendor: {
          id: vendors.id,
          name: vendors.name,
        },

        warehouse: {
          id: sql<string>`COALESCE(${warehouses.id}, ${vendorWarehouses.id})`,
          name: sql<string>`COALESCE(${warehouses.name}, ${vendorWarehouses.name})`,
        },

        salesperson: {
          userId: salespersons.userId,
          name: salespersons.name,
        },

        orderItems: sql<
          {
            productId: string;
            productName: string;
            productPrice: number;
            quantity: number;
            totalPrice: number;
          }[]
        >`
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'productId', ${orderItems.productId},
              'productName', ${products.name},
              'productPrice', ${products.price},
              'quantity', ${orderItems.quantity},
              'totalPrice', ${products.price} * ${orderItems.quantity}
            )
          ) FILTER (WHERE ${orderItems.id} IS NOT NULL),
          '[]'
        )
      `,
      })
      .from(orders)
      .leftJoin(vendors, eq(vendors.id, orders.vendorId))
      .leftJoin(warehouses, eq(warehouses.id, orders.warehouseId))
      .leftJoin(vendorWarehouses, eq(vendorWarehouses.id, vendors.warehouseId))
      .leftJoin(salespersons, eq(salespersons.userId, orders.createdBy))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orders.createdBy, userId))
      .groupBy(
        orders.id,
        vendors.id,
        warehouses.id,
        vendorWarehouses.id,
        vendorWarehouses.name,
        salespersons.id
      )
      .orderBy(desc(orders.createdAt));

    if (typeof limit === "number") {
      (query as any) = query.limit(limit);
    }

    if (typeof offset === "number") {
      (query as any) = query.offset(offset);
    }

    const rows = await query;

    return rows.map(row => ({
      id: row.orderId,
      deliveryDate: row.deliveryDate,
      deliveryStartTime: row.deliveryStartTime,
      deliveryEndTime: row.deliveryEndTime,
      status: row.status as OrderStatus,
      totalAmount: row.totalAmount,
      customer: row.vendor,
      warehouse: row.warehouse,
      salesperson: row.salesperson,
      orderItems: row.orderItems,
      orderItemsCount: row.orderItems.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }


  async updateOrder(
    id: string,
    data: UpdateOrderRequestDTO
  ): Promise<OrderRecord> {
    return await db.transaction(async (tx) => {
      const orderItemsModel = new OrderItemsModel().withTransaction(tx);

      let deliveryDate: Date | null = null;
      if (data?.deliveryDate) {
        deliveryDate =
          data.deliveryDate instanceof Date
            ? data.deliveryDate
            : new Date(data.deliveryDate);

        if (Number.isNaN(deliveryDate.getTime())) {
          throw new Error("Invalid delivery date");
        }
      }

      let totalAmount: string | undefined = undefined;
      if (Array.isArray(data.orderItems) && data.orderItems.length > 0) {
        let total = 0;
        for (const item of data.orderItems) {
          total += item.quantity * item.unitPrice;
        }
        totalAmount = total.toFixed(2);
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          vendorId: data.vendorId,
          warehouseId: data.warehouseId,
          ...(deliveryDate && {
            deliveryDate: deliveryDate.toISOString().split("T")[0],
          }),
          ...(data.deliveryStartTime && {
            deliveryStartTime: data.deliveryStartTime,
          }),
          ...(data.deliveryEndTime && {
            deliveryEndTime: data.deliveryEndTime,
          }),
          status: data.status,
          ...(totalAmount !== undefined && { totalAmount }),
        })
        .where(eq(orders.id, id))
        .returning();

      if (!updatedOrder) {
        throw new Error("Order not found");
      }

      if (!Array.isArray(data.orderItems) || data.orderItems.length === 0) {
        return updatedOrder;
      }

      const existingItems = await tx
        .select({
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      const existingMap = new Map(
        existingItems.map(i => [i.productId, i.quantity])
      );

      const incomingMap = new Map(
        data.orderItems.map(i => [i.productId, i.quantity])
      );

      const deltaPayload: { id: string; qty: number }[] = [];

      for (const item of data.orderItems) {
        if (existingMap.has(item.productId)) {
          const oldQty = existingMap.get(item.productId)!;
          const diff = item.quantity - oldQty;
          if (diff !== 0) {
            deltaPayload.push({ id: item.productId, qty: diff });
          }

          await tx
            .update(orderItems)
            .set({
              quantity: item.quantity,
              totalPrice: (item.quantity * item.unitPrice).toFixed(2),
            })
            .where(
              and(
                eq(orderItems.orderId, id),
                eq(orderItems.productId, item.productId)
              )
            );
        } else {
          deltaPayload.push({ id: item.productId, qty: item.quantity });

          await orderItemsModel.create([
            {
              orderId: id,
              productId: item.productId,
              quantity: item.quantity,
              totalPrice: (item.quantity * item.unitPrice).toFixed(2),
            },
          ]);
        }
      }

      for (const [productId, oldQty] of existingMap) {
        if (!incomingMap.has(productId)) {
          deltaPayload.push({ id: productId, qty: -oldQty });

          await tx
            .delete(orderItems)
            .where(
              and(
                eq(orderItems.orderId, id),
                eq(orderItems.productId, productId)
              )
            );
        }
      }

      if (deltaPayload.length > 0) {
        await tx.execute(sql`
        UPDATE ${products} AS p
        SET quantity_sold = p.quantity_sold + i.qty
        FROM jsonb_to_recordset(${JSON.stringify(deltaPayload)}::jsonb)
             AS i(id uuid, qty numeric)
        WHERE p.id = i.id
      `);
      }

      return updatedOrder;
    });
  }
  async findDailyLimitByCustomerId(
    userId: string,
    customerId: string
  ): Promise<{
    totalTodaysOrder: number
    limitExceeded: boolean
  }> {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

    const nowUtc = new Date()
    const nowIst = new Date(nowUtc.getTime() + IST_OFFSET_MS)

    const istTodayStart = new Date(nowIst)
    istTodayStart.setHours(0, 0, 0, 0)

    const istTomorrowStart = new Date(istTodayStart)
    istTomorrowStart.setDate(istTodayStart.getDate() + 1)

    const utcWindowStart = new Date(istTodayStart.getTime() - IST_OFFSET_MS)
    const utcWindowEnd = new Date(istTomorrowStart.getTime() - IST_OFFSET_MS)

    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          sql`${orders.createdAt} >= ${utcWindowStart}`,
          sql`${orders.createdAt} < ${utcWindowEnd}`,
          or(
            eq(orders.createdBy, userId),
            eq(orders.vendorId, customerId)
          )
        )
      )

    const totalTodaysOrder = Number(result[0]?.count ?? 0)

    return {
      totalTodaysOrder,
      limitExceeded: totalTodaysOrder > 0,
    }
  }

  async findAllOrdersByCustomerUnderSalesperson(salespersonId: string): Promise<OrderResponseDTO[]> {
    const rows = await db
      .select({
        orderId: orders.id,
        deliveryDate: orders.deliveryDate,
        deliveryStartTime: orders.deliveryStartTime,
        deliveryEndTime: orders.deliveryEndTime,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,

        vendor: {
          id: vendors.id,
          name: vendors.name,
        },

        warehouse: {
          id: sql<string>`COALESCE(${warehouses.id}, ${vendorWarehouses.id})`,
          name: sql<string>`COALESCE(${warehouses.name}, ${vendorWarehouses.name})`,
        },

        salesperson: {
          userId: salespersons.userId,
          name: salespersons.name,
        },

        orderItems: sql<
          {
            productId: string;
            productName: string;
            productPrice: number;
            quantity: number;
            totalPrice: number;
          }[]
        >`
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'productId', ${orderItems.productId},
              'productName', ${products.name},
              'productPrice', ${products.price},
              'quantity', ${orderItems.quantity},
              'totalPrice', ${orderItems.totalPrice}
            )
          ) FILTER (WHERE ${orderItems.id} IS NOT NULL),
          '[]'
        )
      `,
      })
      .from(orders)
      .innerJoin(
        vendors,
        eq(vendors.userId, orders.createdBy)
      )
      .innerJoin(
        vendorSalespersons,
        eq(vendorSalespersons.vendorId, vendors.id)
      )
      .leftJoin(
        warehouses,
        eq(warehouses.id, orders.warehouseId)
      )
      .leftJoin(
        vendorWarehouses,
        eq(vendorWarehouses.id, vendors.warehouseId)
      )
      .leftJoin(
        salespersons,
        eq(salespersons.userId, orders.createdBy)
      )
      .leftJoin(
        orderItems,
        eq(orderItems.orderId, orders.id)
      )
      .leftJoin(
        products,
        eq(products.id, orderItems.productId)
      )
      .where(eq(vendorSalespersons.salespersonId, salespersonId))
      .groupBy(
        orders.id,
        vendors.id,
        warehouses.id,
        vendorWarehouses.id,
        vendorWarehouses.name,
        salespersons.id
      )
      .orderBy(desc(orders.createdAt));

    return rows.map(row => ({
      id: row.orderId,
      customer: row.vendor ?? null,
      warehouse: row.warehouse ?? null,
      salesperson: row.salesperson ?? null,
      deliveryDate: row.deliveryDate,
      deliveryStartTime: row.deliveryStartTime,
      deliveryEndTime: row.deliveryEndTime,
      status: row.status as OrderStatus,
      totalAmount: row.totalAmount,
      orderItems: row.orderItems,
      orderItemsCount: row.orderItems.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async pushOrdersToErp(orderIds: string[]): Promise<OrderRecord[]> {
    return await db.transaction(async (tx) => {
      const updatedOrders: OrderRecord[] = [];

      for (const orderId of orderIds) {
        const [orderRecord] = await tx
          .update(orders)
          .set({
            pushedToErp: true
          })
          .where(eq(orders.id, orderId))
          .returning();

        if (!orderRecord?.id) {
          throw new Error(`Failed to update order with id ${orderId}`);
        }

        updatedOrders.push(orderRecord);
      }

      return updatedOrders;
    });
  }
}
