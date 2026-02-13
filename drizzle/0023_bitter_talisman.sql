ALTER TABLE "vendors" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "store_image" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "latitude" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "longitude" double precision NOT NULL;