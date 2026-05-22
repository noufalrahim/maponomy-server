import { productPriceHistory } from "../../infrastructure/db/schemas/product-price-history.schema";
import { BaseModel } from "./base/base.model";

export class ProductPriceHistoryModel extends BaseModel<
    typeof productPriceHistory.$inferSelect,
    typeof productPriceHistory.$inferInsert
> {
    protected readonly table = productPriceHistory;
}
