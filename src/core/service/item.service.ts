import { BaseService } from "./base/base.service";
import { ItemModel } from "../../core/model/item.model";
import {
  NewItem,
  ItemRecord
} from "../../infrastructure/db/schemas/item.schema";

export class ItemService extends BaseService<
  ItemRecord,
  NewItem
> {
  protected readonly model = new ItemModel();
}
