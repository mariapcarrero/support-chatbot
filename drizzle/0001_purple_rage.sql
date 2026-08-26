ALTER TABLE "escalations" ADD COLUMN "summary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "escalations" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "escalations" ADD COLUMN "contact_phone" text;