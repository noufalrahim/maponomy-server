CREATE TABLE "product_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"old_price" numeric NOT NULL,
	"new_price" numeric NOT NULL,
	"edited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_vendor_id_vendors_id_fk";
--> statement-breakpoint
DROP INDEX "idx_products_vendor";--> statement-breakpoint
DROP INDEX "idx_products_vendor_item";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "service_time" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "service_time" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_edited_by_users_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_products_vendor_item" ON "products" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "vendor_id";