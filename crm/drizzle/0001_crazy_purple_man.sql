ALTER TABLE "pulse_checks" ADD COLUMN "booked_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pulse_checks" ADD COLUMN "source_verbatim" text;--> statement-breakpoint
ALTER TABLE "pulse_checks" ADD COLUMN "source_category" text;--> statement-breakpoint
ALTER TABLE "pulse_checks" ADD COLUMN "service_interest" text;--> statement-breakpoint
ALTER TABLE "pulse_checks" ADD COLUMN "sales_outcome" text;--> statement-breakpoint
ALTER TABLE "pulse_checks" ADD COLUMN "sales_outcome_at" timestamp with time zone;--> statement-breakpoint
-- Hand-added, not generated. The DEFAULT now() above backfills every existing
-- row with the timestamp of the migration itself, which would put the whole
-- history into whichever quarter this was deployed in. created_at is the row's
-- real birth and, for a pulse check, the moment the booking was entered.
UPDATE "pulse_checks" SET "booked_at" = "created_at";--> statement-breakpoint
CREATE INDEX "pulse_checks_booked_idx" ON "pulse_checks" USING btree ("booked_at" DESC NULLS LAST) WHERE not "pulse_checks"."is_rehearsal";