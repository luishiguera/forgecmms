CREATE TYPE "public"."asset_assignment_status" AS ENUM('available', 'assigned', 'installed');--> statement-breakpoint
CREATE TYPE "public"."asset_criticality" AS ENUM('critical', 'important', 'normal');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('operational', 'needs_maintenance', 'retired', 'pending');--> statement-breakpoint
CREATE TYPE "public"."attachment_entity_type" AS ENUM('asset', 'part', 'location', 'workorder', 'customer');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('customer', 'vendor', 'both');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."procedure_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."recurrence_type" AS ENUM('none', 'daily', 'weekly', 'monthly_by_date', 'monthly_by_weekday', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('session', 'reset_password');--> statement-breakpoint
CREATE TYPE "public"."work_order_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('pending', 'reviewing', 'planned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."work_order_type" AS ENUM('reactive', 'preventive', 'other');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 561 CACHE 1),
	"organization_id" bigint NOT NULL,
	"parent_asset_id" bigint,
	"location_id" bigint,
	"serial_number" varchar(100) DEFAULT '' NOT NULL,
	"model" varchar(255) DEFAULT '' NOT NULL,
	"manufacturer" varchar(255) DEFAULT '' NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "asset_status" NOT NULL,
	"criticality" "asset_criticality" DEFAULT 'normal' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"assignment_status" "asset_assignment_status" DEFAULT 'available' NOT NULL,
	CONSTRAINT "assets_id_organizationId_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attachments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 449 CACHE 1),
	"organization_id" bigint NOT NULL,
	"entity_type" "attachment_entity_type" NOT NULL,
	"entity_id" bigint NOT NULL,
	"file_url" text DEFAULT '' NOT NULL,
	"file_name" varchar(255) DEFAULT '' NOT NULL,
	"file_size" bigint,
	"mime_type" varchar(100) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "businesses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" bigint NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"type" "business_type" DEFAULT 'customer' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"phones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"tax_id" varchar(50) DEFAULT '' NOT NULL,
	CONSTRAINT "businesses_id_organizationId_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invitations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 183 CACHE 1),
	"email" varchar(255) DEFAULT '' NOT NULL,
	"full_name" varchar(300) DEFAULT '' NOT NULL,
	"organization_id" bigint NOT NULL,
	"has_backoffice" boolean DEFAULT false NOT NULL,
	"has_field" boolean DEFAULT false NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "invitation_status" NOT NULL,
	"inviter_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 344 CACHE 1),
	"organization_id" bigint NOT NULL,
	"parent_location_id" bigint,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"phones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"postal_code" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"business_id" bigint,
	CONSTRAINT "locations_id_organizationId_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organizations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 387 CACHE 1),
	"name" varchar(255) DEFAULT '' NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"owner_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"legal_name" text DEFAULT '' NOT NULL,
	"tax_id" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"postal_code" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "parts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 376 CACHE 1),
	"organization_id" bigint NOT NULL,
	"sku" varchar(50) DEFAULT '' NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_quantity" integer DEFAULT 0 NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT '' NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "parts_id_organizationId_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "procedures" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "procedures_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 131 CACHE 1),
	"organization_id" bigint NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "procedure_status" NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "procedures_id_organizationId_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "schedule_blocks" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "schedule_blocks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 815 CACHE 1),
	"organization_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"type" varchar(20) DEFAULT '' NOT NULL,
	"work_order_id" bigint,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag_assignments" (
	"organization_id" bigint NOT NULL,
	"tag_id" bigint NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	CONSTRAINT "tag_assignments_tag_id_entity_id_pk" PRIMARY KEY("tag_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 214 CACHE 1),
	"organization_id" bigint NOT NULL,
	"tag_type" varchar(50) NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "tags_organizationId_tag_type_name_unique" UNIQUE("organization_id","tag_type","name"),
	CONSTRAINT "tags_id_organizationId_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 923 CACHE 1),
	"token" varchar(64) DEFAULT '' NOT NULL,
	"user_id" bigint NOT NULL,
	"token_type" "token_type" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "tracks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 556 CACHE 1),
	"user_id" bigint NOT NULL,
	"organization_id" bigint NOT NULL,
	"track_date" date NOT NULL,
	"track" jsonb,
	"last_latitude" double precision NOT NULL,
	"last_longitude" double precision NOT NULL,
	"last_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_user_id_organizationId_track_date_unique" UNIQUE("user_id","organization_id","track_date")
);
--> statement-breakpoint
CREATE TABLE "user_organizations" (
	"user_id" bigint NOT NULL,
	"organization_id" bigint NOT NULL,
	"has_backoffice" boolean DEFAULT false NOT NULL,
	"has_field" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"removed_by" bigint,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"working_hours" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "user_organizations_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id"),
	CONSTRAINT "user_organizations_check" CHECK (has_backoffice OR has_field)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 642 CACHE 1),
	"full_name" varchar(300) DEFAULT '' NOT NULL,
	"photo_url" text DEFAULT '' NOT NULL,
	"email" varchar(255) DEFAULT '' NOT NULL,
	"password" varchar(128) DEFAULT '' NOT NULL,
	"status" "status" NOT NULL,
	"language" varchar(10) DEFAULT '' NOT NULL,
	"timezone" varchar(64) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_order_asset_procedures" (
	"organization_id" bigint NOT NULL,
	"work_order_id" bigint NOT NULL,
	"asset_id" bigint NOT NULL,
	"procedure_id" bigint NOT NULL,
	"procedure_responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "work_order_asset_procedures_work_order_id_asset_id_procedure_id_pk" PRIMARY KEY("work_order_id","asset_id","procedure_id")
);
--> statement-breakpoint
CREATE TABLE "work_order_assets" (
	"organization_id" bigint NOT NULL,
	"work_order_id" bigint NOT NULL,
	"asset_id" bigint NOT NULL,
	CONSTRAINT "work_order_assets_work_order_id_asset_id_pk" PRIMARY KEY("work_order_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "work_order_assignees" (
	"organization_id" bigint NOT NULL,
	"work_order_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	CONSTRAINT "work_order_assignees_work_order_id_user_id_pk" PRIMARY KEY("work_order_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "work_order_parts" (
	"organization_id" bigint NOT NULL,
	"work_order_id" bigint NOT NULL,
	"part_id" bigint NOT NULL,
	"planned_quantity" integer DEFAULT 1 NOT NULL,
	"used_quantity" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "work_order_parts_work_order_id_part_id_pk" PRIMARY KEY("work_order_id","part_id")
);
--> statement-breakpoint
CREATE TABLE "work_order_procedures" (
	"organization_id" bigint NOT NULL,
	"work_order_id" bigint NOT NULL,
	"procedure_id" bigint NOT NULL,
	"procedure_responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "work_order_procedures_work_order_id_procedure_id_pk" PRIMARY KEY("work_order_id","procedure_id")
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 702 CACHE 1),
	"organization_id" bigint NOT NULL,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "work_order_status" NOT NULL,
	"type" "work_order_type" NOT NULL,
	"priority" "work_order_priority" NOT NULL,
	"planned_start" timestamp with time zone,
	"planned_end" timestamp with time zone,
	"started_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"cancellation_reason" text DEFAULT '' NOT NULL,
	"recurrence_type" "recurrence_type" NOT NULL,
	"recurrence_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"parent_work_order_id" bigint,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"location_id" bigint,
	"report_url" text,
	"report_generated_at" timestamp with time zone,
	CONSTRAINT "work_orders_id_organizationId_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_parent_asset_id_assets_id_fk" FOREIGN KEY ("parent_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_organization_id_locations_id_organization_id_fk" FOREIGN KEY ("location_id","organization_id") REFERENCES "public"."locations"("id","organization_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_location_id_locations_id_fk" FOREIGN KEY ("parent_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_business_id_organization_id_businesses_id_organization_id_fk" FOREIGN KEY ("business_id","organization_id") REFERENCES "public"."businesses"("id","organization_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_work_order_id_organization_id_work_orders_id_organization_id_fk" FOREIGN KEY ("work_order_id","organization_id") REFERENCES "public"."work_orders"("id","organization_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_assignments" ADD CONSTRAINT "tag_assignments_tag_id_organization_id_tags_id_organization_id_fk" FOREIGN KEY ("tag_id","organization_id") REFERENCES "public"."tags"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_user_id_organization_id_user_organizations_user_id_organization_id_fk" FOREIGN KEY ("user_id","organization_id") REFERENCES "public"."user_organizations"("user_id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_removed_by_users_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_asset_procedures" ADD CONSTRAINT "work_order_asset_procedures_work_order_id_asset_id_work_order_assets_work_order_id_asset_id_fk" FOREIGN KEY ("work_order_id","asset_id") REFERENCES "public"."work_order_assets"("work_order_id","asset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_asset_procedures" ADD CONSTRAINT "work_order_asset_procedures_procedure_id_organization_id_procedures_id_organization_id_fk" FOREIGN KEY ("procedure_id","organization_id") REFERENCES "public"."procedures"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assets" ADD CONSTRAINT "work_order_assets_work_order_id_organization_id_work_orders_id_organization_id_fk" FOREIGN KEY ("work_order_id","organization_id") REFERENCES "public"."work_orders"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assets" ADD CONSTRAINT "work_order_assets_asset_id_organization_id_assets_id_organization_id_fk" FOREIGN KEY ("asset_id","organization_id") REFERENCES "public"."assets"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assignees" ADD CONSTRAINT "work_order_assignees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assignees" ADD CONSTRAINT "work_order_assignees_work_order_id_organization_id_work_orders_id_organization_id_fk" FOREIGN KEY ("work_order_id","organization_id") REFERENCES "public"."work_orders"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_parts" ADD CONSTRAINT "work_order_parts_work_order_id_organization_id_work_orders_id_organization_id_fk" FOREIGN KEY ("work_order_id","organization_id") REFERENCES "public"."work_orders"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_parts" ADD CONSTRAINT "work_order_parts_part_id_organization_id_parts_id_organization_id_fk" FOREIGN KEY ("part_id","organization_id") REFERENCES "public"."parts"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_procedures" ADD CONSTRAINT "work_order_procedures_work_order_id_organization_id_work_orders_id_organization_id_fk" FOREIGN KEY ("work_order_id","organization_id") REFERENCES "public"."work_orders"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_procedures" ADD CONSTRAINT "work_order_procedures_procedure_id_organization_id_procedures_id_organization_id_fk" FOREIGN KEY ("procedure_id","organization_id") REFERENCES "public"."procedures"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_parent_work_order_id_work_orders_id_fk" FOREIGN KEY ("parent_work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_location_id_organization_id_locations_id_organization_id_fk" FOREIGN KEY ("location_id","organization_id") REFERENCES "public"."locations"("id","organization_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assets_status" ON "assets" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_assets_criticality" ON "assets" USING btree ("organization_id","criticality");--> statement-breakpoint
CREATE INDEX "idx_assets_parent_asset_id" ON "assets" USING btree ("parent_asset_id");--> statement-breakpoint
CREATE INDEX "idx_assets_location_id" ON "assets" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_assets_deleted_at" ON "assets" USING btree ("organization_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_assets_org_serial_number_unique_non_empty" ON "assets" USING btree ("organization_id","serial_number") WHERE serial_number <> '' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_attachments_entity" ON "attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_organization_id" ON "attachments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_businesses_organization_id" ON "businesses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_businesses_deleted_at" ON "businesses" USING btree ("organization_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_locations_organization_id" ON "locations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_locations_parent_location_id" ON "locations" USING btree ("parent_location_id");--> statement-breakpoint
CREATE INDEX "idx_locations_deleted_at" ON "locations" USING btree ("organization_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_locations_business_id" ON "locations" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_parts_organization_id" ON "parts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_parts_deleted_at" ON "parts" USING btree ("organization_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_parts_org_sku_unique_non_empty" ON "parts" USING btree ("organization_id","sku") WHERE sku <> '' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_procedures_organization_status" ON "procedures" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_procedures_deleted_at" ON "procedures" USING btree ("deleted_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_schedule_blocks_organization_id" ON "schedule_blocks" USING btree ("organization_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_schedule_blocks_user_id" ON "schedule_blocks" USING btree ("user_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_schedule_blocks_work_order_id" ON "schedule_blocks" USING btree ("work_order_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_schedule_blocks_time_range" ON "schedule_blocks" USING btree ("organization_id","start_time","end_time") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_tag_assignments_entity" ON "tag_assignments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_tag_assignments_tag" ON "tag_assignments" USING btree ("tag_id","entity_type");--> statement-breakpoint
CREATE INDEX "idx_tokens_type" ON "tokens" USING btree ("token_type");--> statement-breakpoint
CREATE INDEX "idx_tracks_org_date" ON "tracks" USING btree ("organization_id","track_date");--> statement-breakpoint
CREATE INDEX "idx_user_organizations_organization_id" ON "user_organizations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_user_organizations_active_org_user" ON "user_organizations" USING btree ("organization_id","user_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_user_organizations_active_user" ON "user_organizations" USING btree ("user_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_work_order_asset_procedures_org" ON "work_order_asset_procedures" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_work_order_assets_asset_id" ON "work_order_assets" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_work_order_assets_org" ON "work_order_assets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_work_order_assignees_user_id" ON "work_order_assignees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_work_order_assignees_org" ON "work_order_assignees" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_work_order_parts_part_id" ON "work_order_parts" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "idx_work_order_parts_org" ON "work_order_parts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_work_order_procedures_procedure_id" ON "work_order_procedures" USING btree ("procedure_id");--> statement-breakpoint
CREATE INDEX "idx_work_order_procedures_org" ON "work_order_procedures" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_work_orders_status" ON "work_orders" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_work_orders_type" ON "work_orders" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "idx_work_orders_priority" ON "work_orders" USING btree ("organization_id","priority");--> statement-breakpoint
CREATE INDEX "idx_work_orders_parent" ON "work_orders" USING btree ("parent_work_order_id");--> statement-breakpoint
CREATE INDEX "idx_work_orders_deleted_at" ON "work_orders" USING btree ("organization_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_work_orders_location_id" ON "work_orders" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_work_orders_planned_start" ON "work_orders" USING btree ("organization_id","planned_start");