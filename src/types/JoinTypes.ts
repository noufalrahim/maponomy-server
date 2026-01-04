import { TableConfig, PgTable } from "drizzle-orm/pg-core";
import { SQL } from "drizzle-orm";

export type JoinType = {
  table: PgTable<TableConfig>;
  on: (base: any, join: any) => SQL | any;
  fromTable?: PgTable<TableConfig>;
};