import { Request, Response } from "express";
import { FieldSelection } from "../../../types";
import { NotFoundError, ValidationError } from "../../../errors";
import { asyncHandler } from "../../../middleware/errorHandler";

export interface CrudModel<TRecord, TInsert> {
  findAll(options?: {
    fields?: FieldSelection;
    limit?: number;
    offset?: number;
  }): Promise<TRecord[]>;

  findById(id: string | number, fields?: FieldSelection): Promise<TRecord | null>;
  create(data: TInsert): Promise<TRecord>;
  updateById(id: string | number, data: Partial<TInsert>, userId?: string): Promise<TRecord>;
  delete(id: string | number): Promise<void>;
}

export abstract class BaseController<TRecord, TInsert> {
  protected abstract model: CrudModel<TRecord, TInsert>;
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

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const fields = this.parseFieldSelection(req);
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    const data = await this.model.findAll({ fields, limit, offset });

    // AuditLoggerService.logSearch(req, this.resourceName, fields?.requested, data.length, true);

    res.json(data);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const created = await this.model.create(req.body);

    // AuditLoggerService.logCreate(req, this.resourceName, (created as any).id, true);

    res.status(201).json(created);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const updated = await this.model.updateById(req.params.id, req.body, userId);

    // AuditLoggerService.logUpdate(req, this.resourceName, req.params.id, true);

    res.json(updated);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.model.delete(req.params.id);

    // AuditLoggerService.logDelete(req, this.resourceName, req.params.id, true);

    res.status(204).end();
  });
}
