import { BaseService } from "./base/base.service";
import { ProductModel } from "../../core/model/product.model";
import {
  NewProduct,
  ProductRecord
} from "../../infrastructure/db/schemas/product.schema";

export class ProductService extends BaseService<
  ProductRecord,
  NewProduct
> {
  protected readonly model = new ProductModel();
}
