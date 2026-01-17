
import { CategoryRecord, NewCategory } from "../../infrastructure/db/schema";
import { CategoryService } from "../service/category.service";
import { BaseController } from "./base/base.controller";

export class CategoryController extends BaseController<
  CategoryRecord,
  NewCategory
> {
  protected service = new CategoryService();
  protected resourceName = "category";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
