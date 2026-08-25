CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid,
	"org_name" text NOT NULL,
	"website_url" text,
	"sector" text,
	"city" text,
	"state" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"contact_role" text,
	"what_they_need" text,
	"urgency" text DEFAULT 'unknown' NOT NULL,
	"permission_to_contact" boolean DEFAULT false NOT NULL,
	"referrer_note" text,
	"status" text DEFAULT 'new' NOT NULL,
	"disposition_reason" text,
	"triaged_at" timestamp with time zone,
	"client_id" uuid,
	"converted_at" timestamp with time zone,
	"internal_notes" text,
	"submitted_via" text DEFAULT 'partner_link' NOT NULL,
	"submitted_ip" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"token" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"revoked_at" timestamp with time zone,
	"relationship" text,
	"notes" text,
	"client_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "leads_partner_idx" ON "leads" USING btree ("partner_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "leads_contact_email_idx" ON "leads" USING btree (lower("contact_email")) WHERE "leads"."contact_email" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "partners_token_key" ON "partners" USING btree ("token");--> statement-breakpoint
CREATE INDEX "partners_status_idx" ON "partners" USING btree ("status");