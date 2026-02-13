// src/types/query.ts
export type Operator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "like";
export interface ConditionNode {
  field: string;
  op: Operator;
  value: unknown;
}

export interface AndNode {
  and: QueryNode[];
}

export interface OrNode {
  or: QueryNode[];
}

export type QueryNode = ConditionNode | AndNode | OrNode;

export interface SortSpec {
  field: string;
  direction: "asc" | "desc";
}

export interface QuerySpec {
  where?: QueryNode;
  sort?: SortSpec[];
  limit?: number;
  offset?: number;
  include?: string;
}
