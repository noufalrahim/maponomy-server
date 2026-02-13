import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../config/database";
import { orders, products, salespersons, vendors, vendorSalespersons } from "../../infrastructure/db/schema";
import { BaseModel } from "./base/base.model";
import { OrderStatus } from "../../types";

export class StatisticsModel extends BaseModel<
  typeof orders.$inferSelect,
  typeof orders.$inferInsert
> {
  protected readonly table = orders;

  public async getAllSalespersonProgress(options: {
    limit: number;
    offset: number;
  }) {
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const perSalesperson = await db
      .select({
        userId: this.table.createdBy,

        salesperson: {
          id: salespersons.id,
          name: salespersons.name,
          monthlyTarget: salespersons.monthlyTarget,
        },

        totalOrdersThisMonth: sql<number>`COUNT(*)`,

        totalDeliveredOrdersThisMonth: sql<number>`
        COUNT(*) FILTER (
          WHERE ${this.table.status} = ${OrderStatus.DELIVERED}
        )
      `,

        totalPendingOrdersThisMonth: sql<number>`
        COUNT(*) FILTER (
          WHERE ${this.table.status} = ${OrderStatus.PENDING}
        )
      `,

        totalCancelledOrdersThisMonth: sql<number>`
        COUNT(*) FILTER (
          WHERE ${this.table.status} = ${OrderStatus.CANCELLED}
        )
      `,

        totalAmountAchievedThisMonth: sql<number>`
        COALESCE(
          SUM(${this.table.totalAmount})
          FILTER (
            WHERE ${this.table.status} = ${OrderStatus.DELIVERED}
          ),
          0
        )
      `,
      })
      .from(this.table)
      .innerJoin(
        salespersons,
        eq(salespersons.userId, this.table.createdBy)
      )
      .where(
        gte(this.table.createdAt, startOfMonth)
      )
      .groupBy(
        this.table.createdBy,
        salespersons.id
      )
      .orderBy(
        sql`
        COALESCE(
          SUM(${this.table.totalAmount})
          FILTER (
            WHERE ${this.table.status} = ${OrderStatus.DELIVERED}
          ),
          0
        ) DESC
      `
      )
      .limit(options.limit)
      .offset(options.offset);

    const totalMonthlyTarget = perSalesperson.reduce(
      (sum, r) => sum + Number(r.salesperson.monthlyTarget ?? 0),
      0
    );

    const totalAchieved = perSalesperson.reduce(
      (sum, r) => sum + Number(r.totalAmountAchievedThisMonth),
      0
    );

    const topPerformer =
      perSalesperson.length > 0 ? perSalesperson[0] : null;

    return {
      totalMonthlyTarget,
      totalAchieved,
      topPerformer,
      salespersons: perSalesperson,
    };
  }


  public async getSalespersonProgress(userId: string, target: number) {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const [result] = await db
      .select({
        userId: this.table.createdBy,

        salesperson: {
          id: salespersons.id,
          name: salespersons.name,
          monthlyTarget: salespersons.monthlyTarget,
        },

        totalOrdersThisMonth: sql<number>`COUNT(*)`,

        totalDeliveredOrdersThisMonth: sql<number>`
          COUNT(*) FILTER (WHERE ${this.table.status} = ${OrderStatus.DELIVERED})
        `,

        totalPendingOrdersThisMonth: sql<number>`
          COUNT(*) FILTER (WHERE ${this.table.status} = ${OrderStatus.PENDING})
        `,

        totalCancelledOrdersThisMonth: sql<number>`
          COUNT(*) FILTER (WHERE ${this.table.status} = ${OrderStatus.CANCELLED})
        `,

        totalAmountAchievedThisMonth: sql<number>`
          COALESCE(
            SUM(${this.table.totalAmount})
            FILTER (WHERE ${this.table.status} = ${OrderStatus.DELIVERED}),
            0
          )
        `,
      })
      .from(this.table)
      .leftJoin(
        salespersons,
        eq(salespersons.userId, this.table.createdBy)
      )
      .where(
        and(
          eq(this.table.createdBy, userId),
          gte(this.table.createdAt, startOfMonth)
        )
      )
      .groupBy(
        this.table.createdBy,
        salespersons.id
      );

    return {
      ...result,
      totalAmountTargetThisMonth: target,
    };
  }

  public async getDashboardStatistics() {
    const [
      [{ totalOrdersPlaced }],
      [{ totalRevenue }],
      [{ activeVendors }],
      [{ totalProducts }],
    ] = await Promise.all([
      db
        .select({
          totalOrdersPlaced: sql<number>`COUNT(*)`,
        })
        .from(orders),

      db
        .select({
          totalRevenue: sql<number>`
          COALESCE(
            SUM(${orders.totalAmount})
            FILTER (WHERE ${orders.status} = ${OrderStatus.DELIVERED}),
            0
          )
        `,
        })
        .from(orders),

      db
        .select({
          activeVendors: sql<number>`COUNT(*)`,
        })
        .from(vendors)
        .where(eq(vendors.active, true)),

      db
        .select({
          totalProducts: sql<number>`COUNT(*)`,
        })
        .from(products),
    ]);

    return {
      totalOrdersPlaced: Number(totalOrdersPlaced),
      totalRevenue: Number(totalRevenue),
      activeVendors: Number(activeVendors),
      products: Number(totalProducts),
    };
  }

  public async getSalespersonStatistics(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const weeklyTargetDivisor = 4;

    const [result] = await db
      .select({
        salespersonId: salespersons.id,
        name: salespersons.name,
        monthlyTarget: salespersons.monthlyTarget,

        totalVendors: sql<number>`
        COUNT(DISTINCT ${vendorSalespersons.vendorId})
      `,

        totalOrders: sql<number>`
        COUNT(DISTINCT ${orders.id})
      `,

        totalAchievedThisMonth: sql<number>`
        COALESCE(
          SUM(${orders.totalAmount})
          FILTER (
            WHERE ${orders.status} = ${OrderStatus.DELIVERED}
              AND ${orders.createdAt} >= ${startOfMonth}
              AND ${orders.createdAt} <= ${endOfMonth}
          ),
          0
        )
      `,

        achievementPercentage: sql<number>`
        CASE
          WHEN ${salespersons.monthlyTarget} > 0 THEN
            (
              COALESCE(
                SUM(${orders.totalAmount})
                FILTER (
                  WHERE ${orders.status} = ${OrderStatus.DELIVERED}
                    AND ${orders.createdAt} >= ${startOfMonth}
                    AND ${orders.createdAt} <= ${endOfMonth}
                ),
                0
              ) / ${salespersons.monthlyTarget}
            ) * 100
          ELSE 0
        END
      `,

        weeklyBreakdown: sql<any>`
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'week', w.week,
              'achieved', COALESCE(a.achieved, 0),
              'target', (${salespersons.monthlyTarget} / ${weeklyTargetDivisor})
            )
            ORDER BY w.week
          )
          FROM generate_series(1, 4) AS w(week)
          LEFT JOIN (
            SELECT
              CASE
                WHEN EXTRACT(DAY FROM o.created_at) BETWEEN 1 AND 7 THEN 1
                WHEN EXTRACT(DAY FROM o.created_at) BETWEEN 8 AND 14 THEN 2
                WHEN EXTRACT(DAY FROM o.created_at) BETWEEN 15 AND 21 THEN 3
                ELSE 4
              END AS week,
              SUM(o.total_amount)
              FILTER (WHERE o.status = ${OrderStatus.DELIVERED}) AS achieved
            FROM orders o
            WHERE
              o.created_by = ${salespersons.userId}
              AND o.created_at >= ${startOfMonth}
              AND o.created_at <= ${endOfMonth}
            GROUP BY week
          ) a ON a.week = w.week
        )
      `,
      })
      .from(salespersons)
      .leftJoin(
        vendorSalespersons,
        eq(vendorSalespersons.salespersonId, salespersons.id)
      )
      .leftJoin(
        orders,
        eq(orders.createdBy, salespersons.userId)
      )
      .where(eq(salespersons.userId, userId))
      .groupBy(
        salespersons.id,
        salespersons.name,
        salespersons.monthlyTarget
      );

    return result;
  }

  public async getCustomerStatistics(userId: string, customerId: string) {
    const [
      [{ totalOrders }],
      [{ totalApprovedOrders }],
      [{ totalPendingOrders }],
      [{ totalAmount }],
      frequentProducts,
    ] = await Promise.all([

      db
        .select({
          totalOrders: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(eq(orders.createdBy, userId)),

      db
        .select({
          totalApprovedOrders: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.createdBy, userId),
            eq(orders.status, OrderStatus.CONFIRMED)
          )
        ),
      db
        .select({
          totalPendingOrders: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.createdBy, userId),
            eq(orders.status, OrderStatus.PENDING)
          )
        ),

      db
        .select({
          totalAmount: sql<number>`
          COALESCE(
            SUM(${orders.totalAmount})
            FILTER (WHERE ${orders.status} = ${OrderStatus.CONFIRMED}),
            0
          )
        `,
        })
        .from(orders)
        .where(eq(orders.createdBy, userId)),

      db
        .select({
          productId: products.id,
          name: products.name,
          quantitySold: products.quantitySold,
        })
        .from(products)
        .orderBy(sql`${products.quantitySold} DESC`),
    ]);

    return {
      totalOrders: Number(totalOrders),
      totalApprovedOrders: Number(totalApprovedOrders),
      totalPendingOrders: Number(totalPendingOrders),
      totalAmount: Number(totalAmount),
      frequentlyOrderedProducts: frequentProducts,
    };
  }


}
