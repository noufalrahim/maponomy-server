import type { AnyPgTable } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

export interface JoinType {
  table: AnyPgTable;
  fromTable?: AnyPgTable;
  on: (base: AnyPgTable, join: AnyPgTable) => SQL;
}
