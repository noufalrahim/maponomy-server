import { SQL, eq, asc, desc, count, inArray } from "drizzle-orm";
import type { AnyPgTable, PgTransaction } from "drizzle-orm/pg-core";
import { db } from "../../../config/database";
import { withTimeout } from "../../../utils/queryTimeout";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { JoinType } from "../../../types";

export interface FindOptions {
  where?: SQL;
  limit?: number;
  offset?: number;
  orderBy?: SQL | SQL[];
  search?: string;
  joins?: JoinType[];
}

type DbExecutor =
  | NodePgDatabase<any>
  | PgTransaction<any, any, any>;

export abstract class BaseModel<
  TRecord extends Record<string, any>,
  TInsert extends Record<string, any>
> {
  protected abstract readonly table: AnyPgTable & {
    createdAt: any;
    updatedAt: any;
  };

  protected executor: DbExecutor = db;

  withTransaction(tx: DbExecutor) {
    this.executor = tx;
    return this;
  }

count = async (where?: SQL): Promise<number> => {
  const query = where
    ? this.executor.select({ count: count() }).from(this.table).where(where)
    : this.executor.select({ count: count() }).from(this.table);

  const result = await withTimeout(query, 25000, "count");
  return Number(result[0]?.count ?? 0);
};


  find = async (options: FindOptions = {}): Promise<TRecord[]> => {
    let query: any = this.executor.select().from(this.table);

    if (options.where) query = query.where(options.where);

    if (options.orderBy) {
      if (Array.isArray(options.orderBy)) {
        query = query.orderBy(...options.orderBy);
      } else {
        query = query.orderBy(options.orderBy);
      }
    } else {
      query = query.orderBy(desc(this.table.createdAt));
    }

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);

    return withTimeout(query, 25000, "find");
  };


  create = async (data: TInsert | TInsert[]): Promise<TRecord> => {
    const query = this.executor
      .insert(this.table)
      .values(data)
      .returning();

    const [row] = await withTimeout(query, 25000, "create");
    return row as TRecord;
  };

  findById = async (id: string | number): Promise<TRecord | null> => {
    const [row] = await this.find({
      where: eq((this.table as any).id, id),
      limit: 1,
    });

    return row ?? null;
  };

  findByIds = async (ids: Array<string | number>): Promise<TRecord[]> => {
    if (ids.length === 0) return [];

    const query = this.executor
      .select()
      .from(this.table)
      .where(inArray((this.table as any).id, ids));

    const rows = await withTimeout(query, 25000, "findByIds");
    return rows as TRecord[];
  };

  updateById = async (
    id: string | number,
    data: Partial<TInsert>
  ): Promise<TRecord> => {
    const query = this.executor
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq((this.table as any).id, id))
      .returning();

    const [row] = await withTimeout(query, 25000, "updateById");
    return row as TRecord;
  };

  deleteById = async (id: string | number): Promise<void> => {
    const query = this.executor
      .delete(this.table)
      .where(eq((this.table as any).id, id));

    await withTimeout(query, 25000, "deleteById");
  };
}
