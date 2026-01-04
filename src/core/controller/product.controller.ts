import { NewProduct, ProductRecord } from "../../infrastructure/db/schemas/product.schema";
import { ProductService } from "../service/product.service";
import { BaseController } from "./base/base.controller";

export class ProductController extends BaseController<
  ProductRecord,
  NewProduct
> {
  protected model = new ProductService();
  protected resourceName = "product";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
