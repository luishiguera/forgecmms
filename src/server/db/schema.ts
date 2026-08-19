import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
	bigint,
	boolean,
	check,
	date,
	doublePrecision,
	foreignKey,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import type { ProcedureFields } from "../domains/procedures/schema";
import type { JsonValue } from "../json";

export type TrackPoint = {
	lat: number;
	lng: number;
	alt?: number;
	at: string;
};

const id = () => bigint({ mode: "number" });
const orgId = () => bigint({ mode: "number" }).notNull();
const createdAt = () =>
	timestamp({ withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`);
const updatedAt = () =>
	timestamp({ withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`);
const deletedAt = () => timestamp({ withTimezone: true });

export const statusEnum = pgEnum("status", ["active", "inactive"]);
export const invitationStatusEnum = pgEnum("invitation_status", [
	"pending",
	"accepted",
	"expired",
	"cancelled",
]);
export const tokenTypeEnum = pgEnum("token_type", [
	"session",
	"reset_password",
]);
export const procedureStatusEnum = pgEnum("procedure_status", [
	"draft",
	"active",
	"archived",
]);
export const assetStatusEnum = pgEnum("asset_status", [
	"operational",
	"needs_maintenance",
	"retired",
	"pending",
]);
export const assetCriticalityEnum = pgEnum("asset_criticality", [
	"critical",
	"important",
	"normal",
]);
export const assetAssignmentStatusEnum = pgEnum("asset_assignment_status", [
	"available",
	"assigned",
	"installed",
]);
export const attachmentEntityTypeEnum = pgEnum("attachment_entity_type", [
	"asset",
	"part",
	"location",
	"workorder",
	"customer",
]);
export const workOrderStatusEnum = pgEnum("work_order_status", [
	"pending",
	"reviewing",
	"planned",
	"in_progress",
	"completed",
	"cancelled",
]);
export const workOrderTypeEnum = pgEnum("work_order_type", [
	"reactive",
	"preventive",
	"other",
]);
export const workOrderPriorityEnum = pgEnum("work_order_priority", [
	"low",
	"medium",
	"high",
	"urgent",
]);
export const recurrenceTypeEnum = pgEnum("recurrence_type", [
	"none",
	"daily",
	"weekly",
	"monthly_by_date",
	"monthly_by_weekday",
	"yearly",
]);
export const businessTypeEnum = pgEnum("business_type", [
	"customer",
	"vendor",
	"both",
]);

export const users = pgTable("users", {
	id: id().generatedAlwaysAsIdentity({ startWith: 642 }).primaryKey(),
	fullName: varchar("full_name", { length: 300 }).notNull().default(""),
	photoUrl: text("photo_url").notNull().default(""),
	email: varchar({ length: 255 }).notNull().default("").unique(),
	password: varchar({ length: 128 }).notNull().default(""),
	status: statusEnum().notNull(),
	language: varchar({ length: 10 }).notNull().default(""),
	timezone: varchar({ length: 64 }).notNull().default(""),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const organizations = pgTable("organizations", {
	id: id().generatedAlwaysAsIdentity({ startWith: 387 }).primaryKey(),
	name: varchar({ length: 255 }).notNull().default(""),
	logoUrl: text("logo_url").notNull().default(""),
	ownerId: bigint("owner_id", { mode: "number" })
		.notNull()
		.references(() => users.id),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
	legalName: text("legal_name").notNull().default(""),
	taxId: text("tax_id").notNull().default(""),
	address: text().notNull().default(""),
	city: text().notNull().default(""),
	state: text().notNull().default(""),
	postalCode: text("postal_code").notNull().default(""),
	country: text().notNull().default(""),
	email: text().notNull().default(""),
	phone: text().notNull().default(""),
});

export type WorkingDay = {
	weekday: number;
	enabled: boolean;
	from: string;
	to: string;
};

export type WorkingHours = WorkingDay[];

export const userOrganizations = pgTable(
	"user_organizations",
	{
		userId: bigint("user_id", { mode: "number" })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		organizationId: bigint("organization_id", { mode: "number" })
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		hasBackoffice: boolean("has_backoffice").notNull().default(false),
		hasField: boolean("has_field").notNull().default(false),
		deletedAt: deletedAt(),
		removedBy: bigint("removed_by", { mode: "number" }).references(
			() => users.id,
		),
		createdAt: createdAt(),
		workingHours: jsonb("working_hours")
			.$type<WorkingHours>()
			.notNull()
			.default([]),
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.organizationId] }),
		check("user_organizations_check", sql`has_backoffice OR has_field`),
		index("idx_user_organizations_organization_id").on(t.organizationId),
		index("idx_user_organizations_active_org_user")
			.on(t.organizationId, t.userId)
			.where(sql`deleted_at IS NULL`),
		index("idx_user_organizations_active_user")
			.on(t.userId)
			.where(sql`deleted_at IS NULL`),
	],
);

export const invitations = pgTable("invitations", {
	id: id().generatedAlwaysAsIdentity({ startWith: 183 }).primaryKey(),
	email: varchar({ length: 255 }).notNull().default(""),
	fullName: varchar("full_name", { length: 300 }).notNull().default(""),
	organizationId: bigint("organization_id", { mode: "number" })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	hasBackoffice: boolean("has_backoffice").notNull().default(false),
	hasField: boolean("has_field").notNull().default(false),
	token: varchar({ length: 64 }).notNull().unique(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	status: invitationStatusEnum().notNull(),
	inviterId: bigint("inviter_id", { mode: "number" })
		.notNull()
		.references(() => users.id),
	createdAt: createdAt(),
});

export const tokens = pgTable(
	"tokens",
	{
		id: id().generatedAlwaysAsIdentity({ startWith: 923 }).primaryKey(),
		token: varchar({ length: 64 }).notNull().default("").unique(),
		userId: bigint("user_id", { mode: "number" })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		tokenType: tokenTypeEnum("token_type").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: createdAt(),
	},
	(t) => [index("idx_tokens_type").on(t.tokenType)],
);

export const tags = pgTable(
	"tags",
	{
		id: id().generatedAlwaysAsIdentity({ startWith: 214 }).primaryKey(),
		organizationId: orgId().references(() => organizations.id, {
			onDelete: "cascade",
		}),
		tagType: varchar("tag_type", { length: 50 }).notNull(),
		name: varchar({ length: 255 }).notNull().default(""),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(t) => [
		unique().on(t.organizationId, t.tagType, t.name),
		unique().on(t.id, t.organizationId),
	],
);

export const tagAssignments = pgTable(
	"tag_assignments",
	{
		organizationId: orgId(),
		tagId: bigint("tag_id", { mode: "number" }).notNull(),
		entityType: varchar("entity_type", { length: 50 }).notNull(),
		entityId: bigint("entity_id", { mode: "number" }).notNull(),
	},
	(t) => [
		primaryKey({ columns: [t.tagId, t.entityId] }),
		foreignKey({
			columns: [t.tagId, t.organizationId],
			foreignColumns: [tags.id, tags.organizationId],
		}).onDelete("cascade"),
		index("idx_tag_assignments_entity").on(t.entityType, t.entityId),
		index("idx_tag_assignments_tag").on(t.tagId, t.entityType),
	],
);

export type PhoneEntry = { number: string };
export type EmailEntry = { address: string };

export const businesses = pgTable(
	"businesses",
	{
		id: id().generatedAlwaysAsIdentity().primaryKey(),
		organizationId: orgId().references(() => organizations.id, {
			onDelete: "cascade",
		}),
		name: varchar({ length: 255 }).notNull().default(""),
		type: businessTypeEnum().notNull().default("customer"),
		description: text().notNull().default(""),
		imageUrl: text("image_url").notNull().default(""),
		phones: jsonb().$type<PhoneEntry[]>().notNull().default([]),
		emails: jsonb().$type<EmailEntry[]>().notNull().default([]),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
		deletedAt: deletedAt(),
		taxId: varchar("tax_id", { length: 50 }).notNull().default(""),
	},
	(t) => [
		unique().on(t.id, t.organizationId),
		index("idx_businesses_organization_id").on(t.organizationId),
		index("idx_businesses_deleted_at")
			.on(t.organizationId)
			.where(sql`deleted_at IS NULL`),
	],
);

export const parts = pgTable(
	"parts",
	{
		id: id().generatedAlwaysAsIdentity({ startWith: 376 }).primaryKey(),
		organizationId: orgId().references(() => organizations.id, {
			onDelete: "cascade",
		}),
		sku: varchar({ length: 50 }).notNull().default(""),
		name: varchar({ length: 255 }).notNull().default(""),
		description: text().notNull().default(""),
		quantity: integer().notNull().default(0),
		minQuantity: integer("min_quantity").notNull().default(0),
		unitPrice: integer("unit_price").notNull().default(0),
		currency: varchar({ length: 3 }).notNull().default(""),
		unitOfMeasure: varchar("unit_of_measure", { length: 50 })
			.notNull()
			.default(""),
		imageUrl: text("image_url").notNull().default(""),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
		deletedAt: deletedAt(),
	},
	(t) => [
		unique().on(t.id, t.organizationId),
		index("idx_parts_organization_id").on(t.organizationId),
		index("idx_parts_deleted_at")
			.on(t.organizationId)
			.where(sql`deleted_at IS NULL`),
		uniqueIndex("idx_parts_org_sku_unique_non_empty")
			.on(t.organizationId, t.sku)
			.where(sql`sku <> '' AND deleted_at IS NULL`),
	],
);

export const locations = pgTable(
	"locations",
	{
		id: id().generatedAlwaysAsIdentity({ startWith: 344 }).primaryKey(),
		organizationId: orgId().references(() => organizations.id, {
			onDelete: "cascade",
		}),
		parentLocationId: bigint("parent_location_id", {
			mode: "number",
		}).references((): AnyPgColumn => locations.id, { onDelete: "set null" }),
		name: varchar({ length: 255 }).notNull().default(""),
		address: text().notNull().default(""),
		description: text().notNull().default(""),
		imageUrl: text("image_url").notNull().default(""),
		phones: jsonb().$type<PhoneEntry[]>().notNull().default([]),
		emails: jsonb().$type<EmailEntry[]>().notNull().default([]),
		latitude: doublePrecision(),
		longitude: doublePrecision(),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
		deletedAt: deletedAt(),
		city: text().notNull().default(""),
		state: text().notNull().default(""),
		postalCode: text("postal_code").notNull().default(""),
		country: text().notNull().default(""),
		businessId: bigint("business_id", { mode: "number" }),
	},
	(t) => [
		unique().on(t.id, t.organizationId),
		foreignKey({
			columns: [t.businessId, t.organizationId],
			foreignColumns: [businesses.id, businesses.organizationId],
		}).onDelete("set null"),
		index("idx_locations_organization_id").on(t.organizationId),
		index("idx_locations_parent_location_id").on(t.parentLocationId),
		index("idx_locations_deleted_at")
			.on(t.organizationId)
			.where(sql`deleted_at IS NULL`),
		index("idx_locations_business_id").on(t.businessId),
	],
);

export const procedures = pgTable(
	"procedures",
	{
		id: id().generatedAlwaysAsIdentity({ startWith: 131 }).primaryKey(),
		organizationId: orgId().references(() => organizations.id, {
			onDelete: "cascade",
		}),
		name: varchar({ length: 255 }).notNull().default(""),
		description: text().notNull().default(""),
		status: procedureStatusEnum().notNull(),
		fields: jsonb().$type<ProcedureFields>().notNull().default([]),
		usesCount: integer("uses_count").notNull().default(0),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
		deletedAt: deletedAt(),
	},
	(t) => [
		unique().on(t.id, t.organizationId),
		index("idx_procedures_organization_status").on(t.organizationId, t.status),
		index("idx_procedures_deleted_at")
			.on(t.organizationId)
			.where(sql`deleted_at IS NULL`),
	],
);

export const assets = pgTable(
	"assets",
	{
		id: id().generatedAlwaysAsIdentity({ startWith: 561 }).primaryKey(),
		organizationId: orgId().references(() => organizations.id, {
			onDelete: "cascade",
		}),
		parentAssetId: bigint("parent_asset_id", { mode: "number" }).references(
			(): AnyPgColumn => assets.id,
			{ onDelete: "set null" },
		),
		locationId: bigint("location_id", { mode: "number" }),
		serialNumber: varchar("serial_number", { length: 100 })
			.notNull()
			.default(""),
		model: varchar({ length: 255 }).notNull().default(""),
		manufacturer: varchar({ length: 255 }).notNull().default(""),
		name: varchar({ length: 255 }).notNull().default(""),
		description: text().notNull().default(""),
		status: assetStatusEnum().notNull(),
		criticality: assetCriticalityEnum().notNull().default("normal"),
		imageUrl: text("image_url").notNull().default(""),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
		deletedAt: deletedAt(),
		assignmentStatus: assetAssignmentStatusEnum("assignment_status")
			.notNull()
			.default("available"),
	},
	(t) => [
		unique().on(t.id, t.organizationId),
		foreignKey({
			columns: [t.locationId, t.organizationId],
			foreignColumns: [locations.id, locations.organizationId],
		}).onDelete("set null"),
		index("idx_assets_status").on(t.organizationId, t.status),
		index("idx_assets_criticality").on(t.organizationId, t.criticality),
		index("idx_assets_parent_asset_id").on(t.parentAssetId),
		index("idx_assets_location_id").on(t.locationId),
		index("idx_assets_deleted_at")
			.on(t.organizationId)
			.where(sql`deleted_at IS NULL`),
		uniqueIndex("idx_assets_org_serial_number_unique_non_empty")
			.on(t.organizationId, t.serialNumber)
			.where(sql`serial_number <> '' AND deleted_at IS NULL`),
	],
);

export const attachments = pgTable(
	"attachments",
	{
		id: id().generatedAlwaysAsIdentity({ startWith: 449 }).primaryKey(),
		organizationId: orgId().references(() => organizations.id, {
			onDelete: "cascade",
		}),
		entityType: attachmentEntityTypeEnum("entity_type").notNull(),
		entityId: bigint("entity_id", { mode: "number" }).notNull(),
		fileUrl: text("file_url").notNull().default(""),
		fileName: varchar("file_name", { length: 255 }).notNull().default(""),
		fileSize: bigint("file_size", { mode: "number" }),
		mimeType: varchar("mime_type", { length: 100 }).notNull().default(""),
		createdAt: createdAt(),
	},
	(t) => [
		index("idx_attachments_entity").on(t.entityType, t.entityId),
		index("idx_attachments_organization_id").on(t.organizationId),
	],
);

export type RecurrenceConfig = {
	interval: number;
	days_of_week: number[] | null;
	day_of_month: number;
	week_of_month: number;
	month_of_year: number;
	end_date: string | null;
	max_occurrences: number | null;
};

export type ProcedureResponses = Record<string, JsonValue>;

export const workOrders = pgTable(
	"work_orders",
	{
		id: id().generatedAlwaysAsIdentity({ startWith: 702 }).primaryKey(),
		organizationId: orgId().references(() => organizations.id, {
			onDelete: "cascade",
		}),
		title: varchar({ length: 255 }).notNull().default(""),
		description: text().notNull().default(""),
		status: workOrderStatusEnum().notNull(),
		type: workOrderTypeEnum().notNull(),
		priority: workOrderPriorityEnum().notNull(),
		plannedStart: timestamp("planned_start", { withTimezone: true }),
		plannedEnd: timestamp("planned_end", { withTimezone: true }),
		startedAt: timestamp("started_at", { withTimezone: true }),
		closedAt: timestamp("closed_at", { withTimezone: true }),
		cancellationReason: text("cancellation_reason").notNull().default(""),
		recurrenceType: recurrenceTypeEnum("recurrence_type").notNull(),
		recurrenceConfig: jsonb("recurrence_config")
			.$type<Partial<RecurrenceConfig>>()
			.notNull()
			.default({}),
		parentWorkOrderId: bigint("parent_work_order_id", {
			mode: "number",
		}).references((): AnyPgColumn => workOrders.id, { onDelete: "set null" }),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
		deletedAt: deletedAt(),
		locationId: bigint("location_id", { mode: "number" }),
		reportUrl: text("report_url"),
		reportGeneratedAt: timestamp("report_generated_at", { withTimezone: true }),
	},
	(t) => [
		unique().on(t.id, t.organizationId),
		foreignKey({
			columns: [t.locationId, t.organizationId],
			foreignColumns: [locations.id, locations.organizationId],
		}).onDelete("set null"),
		index("idx_work_orders_status").on(t.organizationId, t.status),
		index("idx_work_orders_type").on(t.organizationId, t.type),
		index("idx_work_orders_priority").on(t.organizationId, t.priority),
		index("idx_work_orders_parent").on(t.parentWorkOrderId),
		index("idx_work_orders_deleted_at")
			.on(t.organizationId)
			.where(sql`deleted_at IS NULL`),
		index("idx_work_orders_location_id").on(t.locationId),
		index("idx_work_orders_planned_start").on(t.organizationId, t.plannedStart),
	],
);

export const workOrderAssets = pgTable(
	"work_order_assets",
	{
		organizationId: orgId(),
		workOrderId: bigint("work_order_id", { mode: "number" }).notNull(),
		assetId: bigint("asset_id", { mode: "number" }).notNull(),
	},
	(t) => [
		primaryKey({ columns: [t.workOrderId, t.assetId] }),
		foreignKey({
			columns: [t.workOrderId, t.organizationId],
			foreignColumns: [workOrders.id, workOrders.organizationId],
		}).onDelete("cascade"),
		foreignKey({
			columns: [t.assetId, t.organizationId],
			foreignColumns: [assets.id, assets.organizationId],
		}).onDelete("cascade"),
		index("idx_work_order_assets_asset_id").on(t.assetId),
		index("idx_work_order_assets_org").on(t.organizationId),
	],
);

export const workOrderParts = pgTable(
	"work_order_parts",
	{
		organizationId: orgId(),
		workOrderId: bigint("work_order_id", { mode: "number" }).notNull(),
		partId: bigint("part_id", { mode: "number" }).notNull(),
		plannedQuantity: integer("planned_quantity").notNull().default(1),
		usedQuantity: integer("used_quantity").notNull().default(0),
	},
	(t) => [
		primaryKey({ columns: [t.workOrderId, t.partId] }),
		foreignKey({
			columns: [t.workOrderId, t.organizationId],
			foreignColumns: [workOrders.id, workOrders.organizationId],
		}).onDelete("cascade"),
		foreignKey({
			columns: [t.partId, t.organizationId],
			foreignColumns: [parts.id, parts.organizationId],
		}).onDelete("cascade"),
		index("idx_work_order_parts_part_id").on(t.partId),
		index("idx_work_order_parts_org").on(t.organizationId),
	],
);

export const workOrderAssignees = pgTable(
	"work_order_assignees",
	{
		organizationId: orgId(),
		workOrderId: bigint("work_order_id", { mode: "number" }).notNull(),
		userId: bigint("user_id", { mode: "number" })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
	},
	(t) => [
		primaryKey({ columns: [t.workOrderId, t.userId] }),
		foreignKey({
			columns: [t.workOrderId, t.organizationId],
			foreignColumns: [workOrders.id, workOrders.organizationId],
		}).onDelete("cascade"),
		index("idx_work_order_assignees_user_id").on(t.userId),
		index("idx_work_order_assignees_org").on(t.organizationId),
	],
);

export const workOrderProcedures = pgTable(
	"work_order_procedures",
	{
		organizationId: orgId(),
		workOrderId: bigint("work_order_id", { mode: "number" }).notNull(),
		procedureId: bigint("procedure_id", { mode: "number" }).notNull(),
		procedureResponses: jsonb("procedure_responses")
			.$type<ProcedureResponses>()
			.notNull()
			.default({}),
	},
	(t) => [
		primaryKey({ columns: [t.workOrderId, t.procedureId] }),
		foreignKey({
			columns: [t.workOrderId, t.organizationId],
			foreignColumns: [workOrders.id, workOrders.organizationId],
		}).onDelete("cascade"),
		foreignKey({
			columns: [t.procedureId, t.organizationId],
			foreignColumns: [procedures.id, procedures.organizationId],
		}).onDelete("cascade"),
		index("idx_work_order_procedures_procedure_id").on(t.procedureId),
		index("idx_work_order_procedures_org").on(t.organizationId),
	],
);

export const workOrderAssetProcedures = pgTable(
	"work_order_asset_procedures",
	{
		organizationId: orgId(),
		workOrderId: bigint("work_order_id", { mode: "number" }).notNull(),
		assetId: bigint("asset_id", { mode: "number" }).notNull(),
		procedureId: bigint("procedure_id", { mode: "number" }).notNull(),
		procedureResponses: jsonb("procedure_responses")
			.$type<ProcedureResponses>()
			.notNull()
			.default({}),
	},
	(t) => [
		primaryKey({ columns: [t.workOrderId, t.assetId, t.procedureId] }),
		foreignKey({
			columns: [t.workOrderId, t.assetId],
			foreignColumns: [workOrderAssets.workOrderId, workOrderAssets.assetId],
		}).onDelete("cascade"),
		foreignKey({
			columns: [t.procedureId, t.organizationId],
			foreignColumns: [procedures.id, procedures.organizationId],
		}).onDelete("cascade"),
		index("idx_work_order_asset_procedures_org").on(t.organizationId),
	],
);

export const scheduleBlocks = pgTable(
	"schedule_blocks",
	{
		id: id().generatedByDefaultAsIdentity({ startWith: 815 }).primaryKey(),
		organizationId: orgId().references(() => organizations.id, {
			onDelete: "cascade",
		}),
		userId: bigint("user_id", { mode: "number" })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: varchar({ length: 20 }).notNull().default(""),
		workOrderId: bigint("work_order_id", { mode: "number" }),
		startTime: timestamp("start_time", { withTimezone: true }).notNull(),
		endTime: timestamp("end_time", { withTimezone: true }).notNull(),
		note: text().notNull().default(""),
		deletedAt: deletedAt(),
		createdAt: createdAt(),
	},
	(t) => [
		foreignKey({
			columns: [t.workOrderId, t.organizationId],
			foreignColumns: [workOrders.id, workOrders.organizationId],
		}).onDelete("set null"),
		index("idx_schedule_blocks_organization_id")
			.on(t.organizationId)
			.where(sql`deleted_at IS NULL`),
		index("idx_schedule_blocks_user_id")
			.on(t.userId)
			.where(sql`deleted_at IS NULL`),
		index("idx_schedule_blocks_work_order_id")
			.on(t.workOrderId)
			.where(sql`deleted_at IS NULL`),
		index("idx_schedule_blocks_time_range")
			.on(t.organizationId, t.startTime, t.endTime)
			.where(sql`deleted_at IS NULL`),
	],
);

export const tracks = pgTable(
	"tracks",
	{
		id: id().generatedByDefaultAsIdentity({ startWith: 556 }).primaryKey(),
		userId: bigint("user_id", { mode: "number" }).notNull(),
		organizationId: orgId().references(() => organizations.id),
		trackDate: date("track_date", { mode: "string" }).notNull(),
		track: jsonb().$type<TrackPoint[]>(),
		lastLatitude: doublePrecision("last_latitude").notNull(),
		lastLongitude: doublePrecision("last_longitude").notNull(),
		lastTimestamp: timestamp("last_timestamp", { withTimezone: true })
			.notNull()
			.default(sql`now()`),
	},
	(t) => [
		unique().on(t.userId, t.organizationId, t.trackDate),
		foreignKey({
			columns: [t.userId, t.organizationId],
			foreignColumns: [
				userOrganizations.userId,
				userOrganizations.organizationId,
			],
		}),
		index("idx_tracks_org_date").on(t.organizationId, t.trackDate),
	],
);
