import { FieldSelection } from "../../../types";
import { CrudModel } from "../../controller/base/base.controller";
import { BaseModel } from "../../model/base/base.model";


/**
 * BaseService
 * - Adapts BaseModel to CrudModel
 * - NO business logic
 * - NO validation
 * - NO auth
 */
export abstract class BaseService<
  TRecord extends Record<string, any>,
  TInsert extends Record<string, any>
> implements CrudModel<TRecord, TInsert> {
  protected abstract readonly model: BaseModel<TRecord, TInsert>;

  async findAll(options?: {
    fields?: FieldSelection;
    limit?: number;
    offset?: number;
  }): Promise<TRecord[]> {
    return this.model.find({
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  async findById(
    id: string | number,
    _fields?: FieldSelection
  ): Promise<TRecord | null> {
    return this.model.findById(id);
  }

  async create(data: TInsert): Promise<TRecord> {
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
