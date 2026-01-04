import { NewItem, ItemRecord } from "../../infrastructure/db/schemas/item.schema";
import { ItemService } from "../service/item.service";
import { BaseController } from "./base/base.controller";

export class ItemController extends BaseController<
  ItemRecord,
  NewItem
> {
  protected model = new ItemService();
  protected resourceName = "item";

  constructor() {
    super();
    this.selectableFields = [];
    this.defaultFields = [];
  }
}
