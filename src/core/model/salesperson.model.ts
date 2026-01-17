import { SQL, sql, desc } from "drizzle-orm";
import { db } from "../../config/database";
import { salespersons } from "../../infrastructure/db/schemas/salesperson.schema";
import { orders, users } from "../../infrastructure/db/schema";
import { BaseModel } from "./base/base.model";
import { OrderStatus } from "../../types";

export class SalesPersonModel extends BaseModel<
  typeof salespersons.$inferSelect,
  typeof salespersons.$inferInsert
> {
  protected readonly table = salespersons;

  async findAllWithProgress(options: {
    where?: SQL;
    orderBy?: SQL | SQL[];
    limit?: number;
    offset?: number;
  } = {}) {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    let query = db
      .select({
        id: this.table.id,
        monthlyTarget: this.table.monthlyTarget,
        active: this.table.active,
        createdAt: this.table.createdAt,
        updatedAt: this.table.updatedAt,
        phoneNumber: this.table.phoneNumber,
        name: this.table.name,

        user: {
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        },

        monthlyProgress: {
          totalOrdersThisMonth: sql<number>`COUNT(${orders.id})`,

          totalDeliveredOrdersThisMonth: sql<number>`
            COUNT(${orders.id})
            FILTER (WHERE ${orders.status} = ${OrderStatus.DELIVERED})
          `,

          totalPendingOrdersThisMonth: sql<number>`
            COUNT(${orders.id})
            FILTER (WHERE ${orders.status} = ${OrderStatus.PENDING})
          `,

          totalCancelledOrdersThisMonth: sql<number>`
            COUNT(${orders.id})
            FILTER (WHERE ${orders.status} = ${OrderStatus.CANCELLED})
          `,

          totalAmountAchievedThisMonth: sql<number>`
            COALESCE(
              SUM(${orders.totalAmount})
              FILTER (WHERE ${orders.status} = ${OrderStatus.DELIVERED}),
              0
            )
          `,
        },
      })
      .from(this.table)
      .leftJoin(users, sql`${users.id} = ${this.table.userId}`)
      .leftJoin(
        orders,
        sql`
          ${orders.createdBy} = ${this.table.userId}
          AND ${orders.createdAt} >= ${startOfMonth}
        `
      )
      .groupBy(this.table.id, users.id);

    if (options.where) {
      (query as any) = query.where(options.where);
    }

    if (options.orderBy) {
      (query as any) = Array.isArray(options.orderBy)
        ? query.orderBy(...options.orderBy)
        : query.orderBy(options.orderBy);
    } else {
      (query as any) = query.orderBy(desc(this.table.createdAt));
    }

    if (options.limit) (query as any) = query.limit(options.limit);
    if (options.offset) (query as any) = query.offset(options.offset);

    return query;
  }
}
