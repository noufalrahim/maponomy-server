ALTER TABLE "products" ADD COLUMN "quantity_sold" numeric DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_salespersons" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_salespersons" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;