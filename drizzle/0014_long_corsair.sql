ALTER TABLE "products" ADD COLUMN "name" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "package_type" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price" numeric NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image" varchar;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "quantity";