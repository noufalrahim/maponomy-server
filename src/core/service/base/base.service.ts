import {
  and,
  or,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  inArray,
  asc,
  desc,
  SQL,
  sql
} from "drizzle-orm";
import { BaseModel } from "../../model/base/base.model";
import { FieldSelection, QueryNode, QuerySpec } from "../../../types";
import { QUERY_FIELD_MAP } from "../../../utils/query-field-mapper";

export interface BaseFindOptions {
  query?: QuerySpec;
  fields?: FieldSelection;
  isAdmin?: boolean;
}
export abstract class BaseService<
  TRecord extends Record<string, any>,
  TInsert extends Record<string, any>
> {
  protected abstract readonly model: BaseModel<TRecord, TInsert>;

  protected readonly filterableFields: string[] = [];
  protected readonly sortableFields: string[] = [];
  protected readonly sortExpressions: Record<string, SQL> = {};
  private normalizeValue(value: any) {
    if (typeof value === "string" && !isNaN(Date.parse(value))) {
      return new Date(value);
    }
    return value;
  }

  protected applyActiveFilter(where: SQL | undefined, isAdmin?: boolean): SQL | undefined {
    if (isAdmin === false && (this.model as any).table.active) {
      const activeFilter = eq((this.model as any).table.active, true);
      return where ? and(where, activeFilter) : activeFilter;
    }
    return where;
  }
  protected compileWhere(node?: QueryNode): SQL | undefined {
    if (!node) return undefined;

    if ("and" in node) {
      return and(
        ...node.and
          .map(n => this.compileWhere(n))
          .filter((v): v is SQL => Boolean(v))
      );
    }

    if ("or" in node) {
      return or(
        ...node.or
          .map(n => this.compileWhere(n))
          .filter((v): v is SQL => Boolean(v))
      );
    }

    if (!this.filterableFields.includes(node.field)) {
      throw new Error(`Filtering by '${node.field}' is not allowed`);
    }

    const column =
      node.field.includes(".")
        ? QUERY_FIELD_MAP[node.field as keyof typeof QUERY_FIELD_MAP]
        : (this.model as any).table[node.field];

    if (!column) {
      throw new Error(`Invalid field: ${node.field}`);
    }

    switch (node.op) {
      case "eq":
        return eq(column, this.normalizeValue(node.value));

      case "ne":
        return ne(column, this.normalizeValue(node.value));

      case "gt":
        return gt(column, this.normalizeValue(node.value));

      case "gte":
        return gte(column, this.normalizeValue(node.value));

      case "lt":
        return lt(column, this.normalizeValue(node.value));

      case "lte":
        return lte(column, this.normalizeValue(node.value));

      case "in":
        if (!Array.isArray(node.value)) {
          throw new Error("IN operator requires array");
        }
        return inArray(column, node.value);

      case "like":
        if (typeof node.value !== "string") {
          throw new Error("LIKE operator requires string value");
        }

        return sql`CAST(${column} AS TEXT) ILIKE ${"%" + node.value + "%"}`;


      default:
        throw new Error(`Unsupported operator`);
    }
  }


  protected compileOrder(sort?: QuerySpec["sort"]): SQL[] | undefined {
    if (!sort?.length) return undefined;

    return sort.map(s => {
      if (this.sortExpressions[s.field]) {
        return s.direction === "desc"
          ? desc(this.sortExpressions[s.field])
          : asc(this.sortExpressions[s.field]);
      }

      if (!this.sortableFields.includes(s.field)) {
        throw new Error(`Sorting by '${s.field}' not allowed`);
      }

      const col = (this.model as any).table[s.field];
      if (!col) throw new Error(`Invalid sort field`);

      return s.direction === "desc" ? desc(col) : asc(col);
    });
  }

  async find(options: BaseFindOptions): Promise<TRecord[]> {
    const where = this.applyActiveFilter(this.compileWhere(options.query?.where), options.isAdmin);
    const orderBy = this.compileOrder(options.query?.sort);

    return this.model.find({
      where,
      orderBy,
      limit: options.query?.limit,
      offset: options.query?.offset
    });
  }


  async findById(
    id: string | number,
    _fields?: FieldSelection
  ): Promise<TRecord | null> {
    return this.model.findById(id);
  }

  async count(options?: BaseFindOptions): Promise<number> {
    const where = this.applyActiveFilter(this.compileWhere(options?.query?.where), options?.isAdmin);
    return this.model.count(where);
  }

  async findByIds(
    ids: Array<string | number>
  ): Promise<TRecord[]> {
    return this.model.findByIds(ids);
  }

  async create(data: TInsert | TInsert[]): Promise<TRecord> {
    return this.model.create(data);
  }

  async updateById(
    id: string | number,
    data: Partial<TInsert>,
    _userId?: string
  ): Promise<TRecord> {
    return this.model.updateById(id, data);
  }

  async delete(id: string | number): Promise<void> {
    return this.model.deleteById(id);
  }
}
