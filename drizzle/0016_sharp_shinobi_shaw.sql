CREATE TABLE "vendor_salespersons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"salesperson_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendor_salespersons" ADD CONSTRAINT "vendor_salespersons_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_salespersons" ADD CONSTRAINT "vendor_salespersons_salesperson_id_sales_persons_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."sales_persons"("id") ON DELETE no action ON UPDATE no action;