ALTER TABLE "salespersons" RENAME TO "sales_persons";--> statement-breakpoint
ALTER TABLE "sales_persons" DROP CONSTRAINT "salespersons_user_id_unique";--> statement-breakpoint
ALTER TABLE "sales_persons" DROP CONSTRAINT "salespersons_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sales_persons" DROP CONSTRAINT "salespersons_vendor_id_vendors_id_fk";
--> statement-breakpoint
ALTER TABLE "sales_persons" ADD CONSTRAINT "sales_persons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_persons" ADD CONSTRAINT "sales_persons_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_persons" ADD CONSTRAINT "sales_persons_user_id_unique" UNIQUE("user_id");