import { BaseService } from "./base/base.service";
import { CategoryModel } from "../model/category.model";
import {
  NewCategory,
  CategoryRecord
} from "../../infrastructure/db/schemas/category.schema";

export class CategoryService extends BaseService<
  CategoryRecord,
  NewCategory
> {
  protected readonly model = new CategoryModel();
}
