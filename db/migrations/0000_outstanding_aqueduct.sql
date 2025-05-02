CREATE TYPE "public"."membership" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"membership" "membership" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"qbo_realm_id" text,
	"qbo_access_token" text,
	"qbo_refresh_token" text,
	"qbo_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"address" text,
	"coordinates" text,
	"intended_use" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"client_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"estimate_number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"gpm" numeric,
	"ps" numeric,
	"pwl" numeric,
	"psi" numeric,
	"voltage" numeric,
	"prep_time_hours" numeric,
	"install_time_hours" numeric,
	"startup_time_hours" numeric,
	"discharge_package" text,
	"overall_notes" text,
	"subtotal_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0.00',
	"tax_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"qbo_estimate_id" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2),
	"unit_price" numeric(10, 2),
	"line_total" numeric(10, 2),
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text,
	"cost" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labor_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"labor_type" text NOT NULL,
	"description" text,
	"rate_per_hour" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rate" numeric(10, 2),
	"rate_unit" text,
	"cost" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discharge_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_code" text NOT NULL,
	"description" text,
	"components" text,
	"cost" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"company_name" text,
	"company_address" text,
	"company_phone" text,
	"company_email" text,
	"company_logo_url" text,
	"default_sales_tax_rate" numeric(5, 4),
	"email_from_name" text,
	"email_from_address" text,
	"qbo_client_id" text,
	"qbo_client_secret" text,
	"qbo_redirect_uri" text,
	"qbo_environment" text DEFAULT 'sandbox',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_line_items" ADD CONSTRAINT "estimate_line_items_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "estimate_number_idx" ON "estimates" USING btree ("estimate_number");--> statement-breakpoint
CREATE INDEX "estimate_user_id_idx" ON "estimates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "estimate_client_id_idx" ON "estimates" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "estimate_status_idx" ON "estimates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "line_item_estimate_id_idx" ON "estimate_line_items" USING btree ("estimate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "material_name_idx" ON "materials" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "labor_type_idx" ON "labor_rates" USING btree ("labor_type");--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_name_idx" ON "equipment" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "discharge_package_code_idx" ON "discharge_packages" USING btree ("package_code");