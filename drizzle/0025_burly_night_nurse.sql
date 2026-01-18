ALTER TABLE "products" ALTER COLUMN "vendor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_start_time" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_end_time" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pushed_to_erp" boolean DEFAULT false;