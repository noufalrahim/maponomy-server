ALTER TABLE "sales_persons" DROP CONSTRAINT "sales_persons_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "sales_persons" ALTER COLUMN "vendor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sales_persons" ADD CONSTRAINT "sales_persons_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;