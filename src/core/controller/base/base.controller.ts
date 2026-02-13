import { Request, Response } from "express";
import { FieldSelection, QuerySpec } from "../../../types";
import { ValidationError } from "../../../errors";
import { sendSuccess } from "../../../utils/apiResponse";
import { asyncHandler } from "../../../middleware/asyncHandler";
export interface CrudModel<TRecord, TInsert> {
  find(options?: {
    query?: QuerySpec;
    fields?: FieldSelection;
  }): Promise<TRecord[]>;

  findById(id: string | number, fields?: FieldSelection): Promise<TRecord | null>;
  findByIds(ids: Array<string | number>, fields?: FieldSelection): Promise<TRecord[]>;
  create(data: TInsert): Promise<TRecord>;
  updateById(id: string | number, data: Partial<TInsert>, userId?: string): Promise<TRecord>;
  delete(id: string | number): Promise<void>;
}

export abstract class BaseController<TRecord, TInsert> {
  protected abstract service: CrudModel<TRecord, TInsert>;
  protected abstract resourceName: string;

  protected selectableFields: string[] = [];
  protected defaultFields: string[] = [];
  protected excludedFields: string[] = ["password", "passwordHash", "password_hash"];

  protected parseFieldSelection(req: Request): FieldSelection | undefined {
    const fieldsQuery = req.query.fields as string | undefined;

    if (!fieldsQuery) {
      return this.defaultFields.length
        ? { defaults: this.defaultFields, excluded: this.excludedFields, selectable: this.selectableFields }
        : undefined;
    }

    const requested = fieldsQuery.split(",").map(f => f.trim());

    for (const field of requested) {
      if (this.excludedFields.includes(field)) {
        throw new ValidationError(`Field '${field}' cannot be selected`);
      }
      if (this.selectableFields.length && !this.selectableFields.includes(field)) {
        throw new ValidationError(`Field '${field}' is not selectable`);
      }
    }

    return {
      requested,
      defaults: this.defaultFields,
      excluded: this.excludedFields,
      selectable: this.selectableFields
    };
  }

  protected parseFilters(req: Request): Record<string, unknown> {
    const filters: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(req.query)) {
      if (["fields", "limit", "offset", "sort"].includes(key)) continue;
      if (value === undefined) continue;

      filters[key] = value;
    }

    return filters;
  }

  protected parseSort(req: Request): {
    field: string;
    direction: "asc" | "desc";
  } | undefined {
    const sort = req.query.sort as string | undefined;
    if (!sort) return undefined;

    const [field, direction] = sort.split(":");

    console.log(field, direction);

    if (!field) {
      throw new ValidationError("Invalid sort format");
    }

    return {
      field,
      direction: direction === "desc" ? "desc" : "asc",
    };
  }

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as QuerySpec;

    const fields = this.parseFieldSelection(req);

    const data = await this.service.find({
      query: body,
      fields
    });

    return sendSuccess(res, {
      data,
      message: `Found ${data.length} ${this.resourceName}`,
      count: data.length,
      statusCode: 200,
    });
  });


  create = asyncHandler(async (req: Request, res: Response) => {
    const created = await this.service.create(req.body);

    return sendSuccess(res, {
      data: created,
      message: `${this.resourceName} created successfully`,
      statusCode: 201
    });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const updated = await this.service.updateById(req.params.id, req.body, userId);

    return sendSuccess(res, {
      data: updated,
      message: `${this.resourceName} updated successfully`,
      statusCode: 200
    });
  });

  delete = asyncHandler(async (_req: Request, res: Response) => {
    await this.service.delete(_req.params.id);

    return sendSuccess(res, {
      data: null,
      message: `${this.resourceName} deleted successfully`,
      statusCode: 200
    });
  });
}
