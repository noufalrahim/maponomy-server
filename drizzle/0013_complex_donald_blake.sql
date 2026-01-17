ALTER TABLE "items" RENAME TO "categories";--> statement-breakpoint
ALTER TABLE "products" RENAME COLUMN "item_id" TO "category_id";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_item_id_items_id_fk";
--> statement-breakpoint
DROP INDEX "idx_products_item";--> statement-breakpoint
DROP INDEX "idx_products_vendor_item";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_products_item" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_vendor_item" ON "products" USING btree ("vendor_id","category_id");