ALTER TABLE "sales_persons" DROP CONSTRAINT "sales_persons_vendor_id_vendors_id_fk";
--> statement-breakpoint
DROP INDEX "salespersons_vendor_id_idx";--> statement-breakpoint
ALTER TABLE "sales_persons" DROP COLUMN "vendor_id";