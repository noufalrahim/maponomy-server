import { SQL, eq, asc, desc, count } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";
import { db } from "../../../config/database";
import { withTimeout } from "../../../utils/queryTimeout";

export interface FindOptions {
  where?: SQL;
  limit?: number;
  offset?: number;
  orderBy?: {
    column: any;
    direction: "asc" | "desc";
  };
}

export abstract class BaseModel<
  TRecord extends Record<string, any>,
  TInsert extends Record<string, any>
> {
  protected abstract readonly table: AnyPgTable;

  count = async (where?: SQL): Promise<number> => {
    const query = where
      ? db.select({ count: count() }).from(this.table).where(where)
      : db.select({ count: count() }).from(this.table);

    const result = await withTimeout(query, 25000, "count");
    return Number(result[0]?.count ?? 0);
  };

  find = async (options: FindOptions = {}): Promise<TRecord[]> => {
    let query: any = db.select().from(this.table);

    if (options.where) query = query.where(options.where);

    if (options.orderBy?.column) {
      query =
        options.orderBy.direction === "desc"
          ? query.orderBy(desc(options.orderBy.column))
          : query.orderBy(asc(options.orderBy.column));
    }

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);

    return withTimeout(query, 25000, "find");
  };

  findById = async (id: string | number): Promise<TRecord | null> => {
    const [row] = await this.find({
      where: eq((this.table as any).id, id),
      limit: 1,
    });

    return row ?? null;
  };

  create = async (data: TInsert): Promise<TRecord> => {
    const query = db
      .insert(this.table)
      .values(data)
      .returning();

    const [row] = await withTimeout(query, 25000, "create");
    return row as TRecord;
  };

  updateById = async (
    id: string | number,
    data: Partial<TInsert>
  ): Promise<TRecord> => {
    const query = db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq((this.table as any).id, id))
      .returning();

    const [row] = await withTimeout(query, 25000, "updateById");
    return row as TRecord;
  };

  deleteById = async (id: string | number): Promise<void> => {
    const query = db
      .delete(this.table)
      .where(eq((this.table as any).id, id));

    await withTimeout(query, 25000, "deleteById");
  };
}
