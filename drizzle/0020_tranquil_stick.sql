ALTER TABLE "vendors" DROP CONSTRAINT "vendors_warehouse_id_warehouses_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_warehouse_id_warehouses_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_salespersons" DROP CONSTRAINT "vendor_salespersons_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_salespersons" DROP CONSTRAINT "vendor_salespersons_salesperson_id_sales_persons_id_fk";
--> statement-breakpoint
ALTER TABLE "vendors" ALTER COLUMN "warehouse_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "warehouse_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_salespersons" ADD CONSTRAINT "vendor_salespersons_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_salespersons" ADD CONSTRAINT "vendor_salespersons_salesperson_id_sales_persons_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."sales_persons"("id") ON DELETE cascade ON UPDATE no action;