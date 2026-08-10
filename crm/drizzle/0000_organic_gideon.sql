CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"google_sub" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "app_user_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sector" text,
	"website_url" text,
	"domains" text[] DEFAULT '{}' NOT NULL,
	"city" text,
	"state" text,
	"status" text DEFAULT 'lead' NOT NULL,
	"source" text,
	"sanity_client_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_decision_maker" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_match_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gmail_message_id" text NOT NULL,
	"gmail_thread_id" text,
	"from_email" text,
	"to_emails" text[],
	"subject" text,
	"snippet" text,
	"occurred_at" timestamp with time zone,
	"suggested_client_id" uuid,
	"match_reason" text,
	"resolved_action" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_match_queue_gmail_message_id_unique" UNIQUE("gmail_message_id")
);
--> statement-breakpoint
CREATE TABLE "gmail_sync_state" (
	"google_account_id" uuid PRIMARY KEY NOT NULL,
	"last_history_id" text,
	"last_full_sync_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"last_error" text,
	"backfill_cursor" text,
	"backfill_done" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"scopes" text[] NOT NULL,
	"refresh_token_ct" "bytea" NOT NULL,
	"refresh_token_iv" "bytea" NOT NULL,
	"refresh_token_tag" "bytea" NOT NULL,
	"access_token_ct" "bytea",
	"access_token_iv" "bytea",
	"access_token_tag" "bytea",
	"access_token_expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "google_accounts_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"version" integer NOT NULL,
	"label" text NOT NULL,
	"definition" jsonb NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"contact_id" uuid,
	"source" text NOT NULL,
	"kind" text NOT NULL,
	"direction" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"subject" text,
	"body" text,
	"external_id" text,
	"external_thread_id" text,
	"message_count" integer DEFAULT 1 NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text,
	"status" text DEFAULT 'proposed' NOT NULL,
	"originating_pulse_check_id" uuid,
	"price_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"started_on" timestamp,
	"due_on" timestamp,
	"closed_on" timestamp,
	"summary" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"is_rehearsal" boolean DEFAULT false NOT NULL,
	"scheduled_at" timestamp with time zone,
	"prep_completed_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"readout_due_at" timestamp with time zone,
	"modules_enabled" text[] DEFAULT '{}' NOT NULL,
	"prep" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"track_two" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rev" integer DEFAULT 0 NOT NULL,
	"trigger_text" text,
	"goal_in_their_words" text,
	"five_second_read" text,
	"five_second_read_locked_at" timestamp with time zone,
	"what_they_actually_do" text,
	"find_noticed" text,
	"trust_noticed" text,
	"choose_noticed" text,
	"steps_to_contact" smallint,
	"honest_reply_time" text,
	"locked_assets" text,
	"capacity" text,
	"decision_maker" text,
	"one_thing_said_out_loud" text,
	"plan_shaped_not_answered" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pulse_check_id" uuid NOT NULL,
	"observations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rec_what" text,
	"rec_why_first" text,
	"rec_effort" text,
	"rec_mode" text,
	"didnt_cover" text,
	"ladder_rule" smallint,
	"ladder_rationale" text,
	"quotes_used" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lint_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"char_count" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp with time zone,
	"rendered_html" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "readouts_pulse_check_id_unique" UNIQUE("pulse_check_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip" "inet"
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"detail" text,
	"client_id" uuid,
	"project_id" uuid,
	"pulse_check_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" smallint DEFAULT 2 NOT NULL,
	"due_at" timestamp with time zone,
	"done_at" timestamp with time zone,
	"created_from" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_match_queue" ADD CONSTRAINT "email_match_queue_suggested_client_id_clients_id_fk" FOREIGN KEY ("suggested_client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_sync_state" ADD CONSTRAINT "gmail_sync_state_google_account_id_google_accounts_id_fk" FOREIGN KEY ("google_account_id") REFERENCES "public"."google_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_accounts" ADD CONSTRAINT "google_accounts_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_originating_pulse_check_id_pulse_checks_id_fk" FOREIGN KEY ("originating_pulse_check_id") REFERENCES "public"."pulse_checks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_checks" ADD CONSTRAINT "pulse_checks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_checks" ADD CONSTRAINT "pulse_checks_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readouts" ADD CONSTRAINT "readouts_pulse_check_id_pulse_checks_id_fk" FOREIGN KEY ("pulse_check_id") REFERENCES "public"."pulse_checks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_pulse_check_id_pulse_checks_id_fk" FOREIGN KEY ("pulse_check_id") REFERENCES "public"."pulse_checks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contacts_client_idx" ON "contacts" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts" USING btree (lower("email")) WHERE "contacts"."email" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "instruments_key_version_key" ON "instruments" USING btree ("key","version");--> statement-breakpoint
CREATE UNIQUE INDEX "instruments_current_idx" ON "instruments" USING btree ("key") WHERE "instruments"."is_current";--> statement-breakpoint
CREATE INDEX "interactions_timeline_idx" ON "interactions" USING btree ("client_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "interactions_ext_key" ON "interactions" USING btree ("source","external_id") WHERE "interactions"."external_id" is not null;--> statement-breakpoint
CREATE INDEX "pulse_checks_client_idx" ON "pulse_checks" USING btree ("client_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "pulse_checks_due_idx" ON "pulse_checks" USING btree ("readout_due_at") WHERE "pulse_checks"."status" in ('captured', 'readout_drafted');--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tasks_board_idx" ON "tasks" USING btree ("status","priority","due_at");