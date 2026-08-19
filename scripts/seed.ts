import { randomBytes } from "node:crypto";
import "dotenv/config";
import { getTableName, is, sql, Table } from "drizzle-orm";
import { hashPassword } from "../src/server/auth/password.ts";
import { db } from "../src/server/db/client.ts";
import type { ProcedureResponses } from "../src/server/db/schema.ts";
import * as schema from "../src/server/db/schema.ts";
import { tracks, users } from "../src/server/db/schema.ts";
import type { AssetResponse } from "../src/server/domains/assets/schema.ts";
import { assetCreateSchema } from "../src/server/domains/assets/schema.ts";
import * as assetsService from "../src/server/domains/assets/service.ts";
import { attachmentCreateSchema } from "../src/server/domains/attachments/schema.ts";
import * as attachmentsService from "../src/server/domains/attachments/service.ts";
import { businessCreateSchema } from "../src/server/domains/businesses/schema.ts";
import * as businessesService from "../src/server/domains/businesses/service.ts";
import * as invitationsRepository from "../src/server/domains/invitations/repository.ts";
import type { LocationResponse } from "../src/server/domains/locations/schema.ts";
import { locationCreateSchema } from "../src/server/domains/locations/schema.ts";
import * as locationsService from "../src/server/domains/locations/service.ts";
import * as organizationsRepository from "../src/server/domains/organizations/repository.ts";
import { partCreateSchema } from "../src/server/domains/parts/schema.ts";
import * as partsService from "../src/server/domains/parts/service.ts";
import type { ProcedureFields } from "../src/server/domains/procedures/schema.ts";
import { procedureCreateSchema } from "../src/server/domains/procedures/schema.ts";
import * as proceduresService from "../src/server/domains/procedures/service.ts";
import { scheduleBlockCreateSchema } from "../src/server/domains/schedule/schema.ts";
import * as scheduleService from "../src/server/domains/schedule/service.ts";
import { tagCreateSchema } from "../src/server/domains/tags/schema.ts";
import * as tagsService from "../src/server/domains/tags/service.ts";
import { workOrderCreateSchema } from "../src/server/domains/workorders/schema.ts";
import * as workOrdersService from "../src/server/domains/workorders/service.ts";
import type { TenantContext } from "../src/server/tenant.ts";
import { addDays, todayKey, wallToInstant } from "../src/utils/day.ts";

const PASSWORD = "forge1234";
const TIMEZONE = "America/New_York";
const STORAGE_URL = `${process.env.BASE_URL ?? "http://localhost:3000"}/storage`;

const dateOnly = (dayOffset: number) => addDays(todayKey(TIMEZONE), dayOffset);

const at = (dayOffset: number, hour: number) =>
	wallToInstant(dateOnly(dayOffset), hour * 60, TIMEZONE).toISOString();

const people = [
	{ fullName: "John Doe", email: "owner@forgecmms.com", field: false },
	{ fullName: "Jane Doe", email: "jane@forgecmms.com", field: false },
	{ fullName: "Mike Smith", email: "mike@forgecmms.com", field: true },
	{ fullName: "Sarah Johnson", email: "sarah@forgecmms.com", field: true },
	{ fullName: "David Brown", email: "david@forgecmms.com", field: true },
];

const outsider = { fullName: "Emily Clark", email: "emily@forgecmms.com" };

const workingHours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
	weekday,
	enabled: weekday >= 1 && weekday <= 5,
	from: "08:00",
	to: weekday === 5 ? "15:00" : "17:00",
}));

const invitationSeeds = [
	{
		fullName: "Robert Miller",
		email: "robert@forgecmms.com",
		backoffice: false,
		field: true,
		status: "pending",
		expiresInDays: 6,
	},
	{
		fullName: "Lisa Wilson",
		email: "lisa@forgecmms.com",
		backoffice: true,
		field: true,
		status: "expired",
		expiresInDays: -2,
	},
	{
		fullName: "Tom Harris",
		email: "tom@forgecmms.com",
		backoffice: true,
		field: false,
		status: "cancelled",
		expiresInDays: 4,
	},
] as const;

const tagSeeds = {
	asset: ["Compressed air", "Production line", "Leased"],
	location: ["Tampa", "Orlando", "Restricted access"],
	part: ["Consumable", "Rotating equipment", "Critical stock"],
	procedure: ["Safety", "Inspection", "Legal check"],
	work_order: ["Night shift", "Warranty", "Plant shutdown"],
} as const;

type TagType = keyof typeof tagSeeds;

const businessSeeds = [
	{
		name: "Gulf Coast Compressors",
		taxId: "59-1234567",
		type: "vendor",
		description: "Compressor service contract and original spare parts",
		phone: "+1 813 555 0110",
		email: "service@gulfcoastcompressors.com",
	},
	{
		name: "Sunshine Beverage Group",
		taxId: "59-2345678",
		type: "customer",
		description: "Owner of the bottling plants under maintenance",
		phone: "+1 813 555 0120",
		email: "maintenance@sunshinebeverage.com",
	},
	{
		name: "Bayside Industrial Services",
		taxId: "59-3456789",
		type: "both",
		description: "Subcontractor for the water treatment plants",
		phone: "+1 407 555 0130",
		email: "operations@baysideindustrial.com",
	},
	{
		name: "Tampa Bearing Supply",
		taxId: "59-4567890",
		type: "vendor",
		description: "Bearings, seals and belts distributor",
		phone: "+1 813 555 0140",
		email: "orders@tampabearing.com",
	},
] as const;

const locationSeeds = [
	{
		name: "North Plant",
		address: "4120 Adamo Drive",
		city: "Tampa",
		state: "FL",
		postalCode: "33605",
		country: "US",
		latitude: 27.9445,
		longitude: -82.409,
		parentIndex: null,
		businessIndex: 1,
		tagIndex: 0,
		phone: "+1 813 555 0210",
		email: "northplant@sunshinebeverage.com",
	},
	{
		name: "Spare Parts Warehouse",
		address: "6210 Anderson Road",
		city: "Tampa",
		state: "FL",
		postalCode: "33634",
		country: "US",
		latitude: 28.0006,
		longitude: -82.535,
		parentIndex: null,
		businessIndex: null,
		tagIndex: 0,
		phone: "+1 813 555 0220",
		email: "warehouse@forgecmms.com",
	},
	{
		name: "Compressor Room",
		address: "4120 Adamo Drive, building 3",
		city: "Tampa",
		state: "FL",
		postalCode: "33605",
		country: "US",
		latitude: 27.9448,
		longitude: -82.4085,
		parentIndex: 0,
		businessIndex: 1,
		tagIndex: 2,
		phone: "+1 813 555 0230",
		email: "compressorroom@sunshinebeverage.com",
	},
	{
		name: "Packaging Area",
		address: "2250 Sand Lake Road",
		city: "Orlando",
		state: "FL",
		postalCode: "32809",
		country: "US",
		latitude: 28.452,
		longitude: -81.396,
		parentIndex: null,
		businessIndex: 1,
		tagIndex: 1,
		phone: "+1 407 555 0240",
		email: "packaging@sunshinebeverage.com",
	},
	{
		name: "Water Treatment Plant",
		address: "1800 Consulate Drive",
		city: "Orlando",
		state: "FL",
		postalCode: "32837",
		country: "US",
		latitude: 28.447,
		longitude: -81.401,
		parentIndex: 3,
		businessIndex: 2,
		tagIndex: 2,
		phone: "+1 407 555 0250",
		email: "water@baysideindustrial.com",
	},
] as const;

const assetSeeds = [
	{
		name: "Screw Compressor A1",
		status: "operational",
		criticality: "critical",
		model: "GA 75 VSD",
		manufacturer: "Atlas Copco",
		description: "Main compressed air supply for the whole plant",
		locationIndex: 2,
		parentIndex: null,
		tagIndex: 0,
	},
	{
		name: "Filling Line 2",
		status: "operational",
		criticality: "critical",
		model: "FL-2000",
		manufacturer: "Krones",
		description: "Bottling line of 12000 bottles per hour",
		locationIndex: 3,
		parentIndex: null,
		tagIndex: 1,
	},
	{
		name: "Boiler B3",
		status: "needs_maintenance",
		criticality: "important",
		model: "TH-3000",
		manufacturer: "Bosch",
		description: "Steam boiler with a yearly legal inspection",
		locationIndex: 0,
		parentIndex: null,
		tagIndex: 1,
	},
	{
		name: "Forklift 07",
		status: "operational",
		criticality: "normal",
		model: "H25T",
		manufacturer: "Linde",
		description: "Warehouse forklift on a rental contract",
		locationIndex: 1,
		parentIndex: null,
		tagIndex: 2,
	},
	{
		name: "Cooling Tower",
		status: "operational",
		criticality: "important",
		model: "CT-450",
		manufacturer: "Baltimore Aircoil",
		description: "Open circuit tower with a legionella control plan",
		locationIndex: 4,
		parentIndex: null,
		tagIndex: 1,
	},
	{
		name: "Conveyor C4",
		status: "needs_maintenance",
		criticality: "normal",
		model: "MB-800",
		manufacturer: "Interroll",
		description: "Belt conveyor between the filler and the palletizer",
		locationIndex: 3,
		parentIndex: null,
		tagIndex: 1,
	},
	{
		name: "Air Dryer D1",
		status: "operational",
		criticality: "normal",
		model: "FD 260",
		manufacturer: "Atlas Copco",
		description: "Refrigerated dryer downstream of the compressor",
		locationIndex: 2,
		parentIndex: 0,
		tagIndex: 0,
	},
	{
		name: "Backup Generator",
		status: "pending",
		criticality: "critical",
		model: "QAS 150",
		manufacturer: "Atlas Copco",
		description: "Diesel generator for the emergency circuits",
		locationIndex: 0,
		parentIndex: null,
		tagIndex: 2,
	},
] as const;

const partSeeds = [
	{
		sku: "BRG-6205",
		name: "Ball bearing 6205",
		description: "Deep groove ball bearing for the conveyor drums",
		quantity: 24,
		min: 6,
		unitPrice: 12,
		uom: "unit",
		tagIndex: 1,
	},
	{
		sku: "FLT-A120",
		name: "Air filter A120",
		description: "Intake filter for the screw compressors",
		quantity: 8,
		min: 10,
		unitPrice: 39,
		uom: "unit",
		tagIndex: 0,
	},
	{
		sku: "SEA-3040",
		name: "Shaft seal 30x40",
		description: "Nitrile shaft seal for the pump housings",
		quantity: 40,
		min: 12,
		unitPrice: 5,
		uom: "unit",
		tagIndex: 1,
	},
	{
		sku: "BLT-A55",
		name: "V belt A55",
		description: "Drive belt for the filling line motors",
		quantity: 3,
		min: 8,
		unitPrice: 9,
		uom: "unit",
		tagIndex: 2,
	},
	{
		sku: "LUB-SAE40",
		name: "Lubricant SAE 40, 5 L",
		description: "Mineral oil for the gearboxes",
		quantity: 15,
		min: 5,
		unitPrice: 28,
		uom: "can",
		tagIndex: 0,
	},
	{
		sku: "VLV-025",
		name: "Solenoid valve 1/4",
		description: "Water line valve of the cooling tower",
		quantity: 6,
		min: 4,
		unitPrice: 46,
		uom: "unit",
		tagIndex: 1,
	},
	{
		sku: "SNS-PT100",
		name: "Temperature probe PT100",
		description: "Probe for the boiler control loop",
		quantity: 11,
		min: 3,
		unitPrice: 32,
		uom: "unit",
		tagIndex: 2,
	},
	{
		sku: "FUS-16A",
		name: "Fuse 16 A",
		description: "Cartridge fuse for the generator panel",
		quantity: 60,
		min: 20,
		unitPrice: 2,
		uom: "unit",
		tagIndex: 0,
	},
	{
		sku: "CPL-M32",
		name: "Flexible coupling M32",
		description: "Elastic coupling between the motor and the gearbox",
		quantity: 2,
		min: 5,
		unitPrice: 58,
		uom: "unit",
		tagIndex: 2,
	},
	{
		sku: "HOS-PN16",
		name: "Hydraulic hose PN16",
		description: "Hose for the forklift lift circuit",
		quantity: 18,
		min: 6,
		unitPrice: 22,
		uom: "meter",
		tagIndex: 1,
	},
] as const;

const procedureSeeds: {
	name: string;
	description: string;
	status: string;
	tagIndex: number;
	fields: ProcedureFields;
	responses: ProcedureResponses;
}[] = [
	{
		name: "Compressor quarterly service",
		description: "Checklist for the quarterly service of the screw compressors",
		status: "active",
		tagIndex: 0,
		fields: [
			{
				nodeType: "embed",
				id: "safety_note",
				type: "note",
				label: "Before you start",
				order: 0,
				src: "",
				alt: "",
				caption: "",
				noteVariant: "warning",
				noteContent:
					"Lock out the machine and release the pressure before you open the cabinet",
			},
			{
				nodeType: "field",
				id: "oil_level",
				type: "multiple_choice",
				label: "Oil level",
				order: 1,
				options: ["Low", "Correct", "High"],
				validation: [{ type: "required", message: "Select the oil level" }],
			},
			{
				nodeType: "field",
				id: "discharge_pressure",
				type: "number",
				label: "Discharge pressure in bar",
				order: 2,
				validation: [
					{
						type: "max",
						value: 10,
						message: "The pressure must stay below 10",
					},
				],
			},
			{
				nodeType: "field",
				id: "replaced_items",
				type: "checkboxes",
				label: "Replaced items",
				order: 3,
				options: ["Air filter", "Oil filter", "Separator", "Belt"],
				validation: [],
			},
			{
				nodeType: "field",
				id: "cabinet_photo",
				type: "photo",
				label: "Photo of the cabinet after the service",
				order: 4,
				photo_config: {
					multiple: false,
					max_files: 1,
					accepted_types: ["image/jpeg", "image/png"],
				},
				validation: [],
			},
			{
				nodeType: "field",
				id: "technician_signature",
				type: "signature",
				label: "Technician signature",
				order: 5,
				validation: [{ type: "required", message: "Sign the report" }],
			},
		],
		responses: {
			oil_level: "Correct",
			discharge_pressure: 7.4,
			replaced_items: ["Air filter", "Oil filter"],
		},
	},
	{
		name: "Boiler pressure check",
		description: "Weekly control of the steam boiler pressure and safety valve",
		status: "active",
		tagIndex: 2,
		fields: [
			{
				nodeType: "field",
				id: "service_pressure",
				type: "number",
				label: "Service pressure in bar",
				order: 0,
				validation: [
					{ type: "required", message: "Write the service pressure" },
				],
			},
			{
				nodeType: "field",
				id: "safety_valve",
				type: "toggle",
				label: "The safety valve opens at the set point",
				order: 1,
				validation: [],
			},
			{
				nodeType: "field",
				id: "water_quality",
				type: "linear_scale",
				label: "Water quality",
				order: 2,
				scale_config: { min: 1, max: 5, min_label: "Bad", max_label: "Good" },
				validation: [],
			},
			{
				nodeType: "field",
				id: "remarks",
				type: "long_text",
				label: "Remarks",
				order: 3,
				text_config: { max_length: 2000, min_rows: 3, max_rows: 8 },
				validation: [],
			},
		],
		responses: {
			service_pressure: 8.1,
			safety_valve: true,
			water_quality: 4,
			remarks: "The pressure is stable, no leak on the manifold",
		},
	},
	{
		name: "Forklift daily inspection",
		description: "Inspection the driver does before the first use of the day",
		status: "active",
		tagIndex: 1,
		fields: [
			{
				nodeType: "field",
				id: "hour_meter",
				type: "number",
				label: "Hour meter",
				order: 0,
				validation: [{ type: "required", message: "Read the hour meter" }],
			},
			{
				nodeType: "field",
				id: "checks",
				type: "checkboxes",
				label: "Checked items",
				order: 1,
				options: ["Brakes", "Horn", "Lights", "Tyres", "Forks"],
				validation: [],
			},
			{
				nodeType: "field",
				id: "condition",
				type: "rating",
				label: "General condition",
				order: 2,
				rating_config: { max_rating: 5, icon: "star" },
				validation: [],
			},
			{
				nodeType: "field",
				id: "driver_signature",
				type: "signature",
				label: "Driver signature",
				order: 3,
				validation: [],
			},
		],
		responses: {
			hour_meter: 4318,
			checks: ["Brakes", "Horn", "Lights"],
			condition: 4,
		},
	},
	{
		name: "Generator load test",
		description:
			"Load test of the diesel generator with the emergency circuits",
		status: "active",
		tagIndex: 2,
		fields: [
			{
				nodeType: "embed",
				id: "wiring_diagram",
				type: "image",
				label: "Wiring diagram",
				order: 0,
				src: `${STORAGE_URL}/seed/generator-wiring-diagram.png`,
				alt: "Wiring diagram of the emergency panel",
				caption: "Emergency panel, revision C",
			},
			{
				nodeType: "field",
				id: "run_time",
				type: "number",
				label: "Run time in minutes",
				order: 1,
				validation: [{ type: "min", value: 30, message: "Run it 30 minutes" }],
			},
			{
				nodeType: "field",
				id: "load",
				type: "number",
				label: "Load in kW",
				order: 2,
				validation: [],
			},
			{
				nodeType: "field",
				id: "fuel_level",
				type: "multiple_choice",
				label: "Fuel level after the test",
				order: 3,
				options: ["Below half", "Half", "Full"],
				validation: [],
			},
			{
				nodeType: "field",
				id: "test_date",
				type: "date",
				label: "Test date",
				order: 4,
				validation: [],
			},
		],
		responses: {
			run_time: 45,
			load: 118,
			fuel_level: "Half",
			test_date: dateOnly(-3),
		},
	},
	{
		name: "Cooling tower legionella sampling",
		description: "Sample collection for the legal legionella control plan",
		status: "draft",
		tagIndex: 2,
		fields: [
			{
				nodeType: "field",
				id: "sample_id",
				type: "short_text",
				label: "Sample identifier",
				order: 0,
				validation: [{ type: "required", message: "Write the sample id" }],
			},
			{
				nodeType: "field",
				id: "sample_datetime",
				type: "datetime",
				label: "Sample date and time",
				order: 1,
				validation: [],
			},
			{
				nodeType: "field",
				id: "chlorine",
				type: "number",
				label: "Free chlorine in ppm",
				order: 2,
				validation: [],
			},
			{
				nodeType: "field",
				id: "lab_report",
				type: "file",
				label: "Laboratory report",
				order: 3,
				file_config: {
					multiple: false,
					max_files: 1,
					accepted_types: ["application/pdf"],
				},
				validation: [],
			},
		],
		responses: {},
	},
	{
		name: "Lubrication route 2019",
		description: "Old lubrication route, replaced by the line procedures",
		status: "archived",
		tagIndex: 1,
		fields: [
			{
				nodeType: "field",
				id: "points_done",
				type: "number",
				label: "Lubricated points",
				order: 0,
				validation: [],
			},
			{
				nodeType: "field",
				id: "grease_type",
				type: "short_text",
				label: "Grease type",
				order: 1,
				validation: [],
			},
		],
		responses: {},
	},
];

const workOrderSeeds = [
	{
		title: "Quarterly compressor service",
		description:
			"Full service of the screw compressor with the manufacturer checklist",
		status: "planned",
		type: "preventive",
		priority: "high",
		dayOffset: 0,
		startHour: 9,
		hours: 2,
		locationIndex: 2,
		assetIndex: 0,
		partIndex: 1,
		assigneeIndex: 1,
		tagIndex: 2,
		procedureIndex: null,
		assetProcedureIndex: 0,
		recurrenceType: "monthly_by_date",
		recurrenceInterval: 3,
		recurrenceDayOfMonth: 15,
		recurrenceDays: null,
	},
	{
		title: "Replace worn V belt",
		description: "The belt of the filling line motor slips under load",
		status: "in_progress",
		type: "reactive",
		priority: "urgent",
		dayOffset: 0,
		startHour: 12,
		hours: 1,
		locationIndex: 3,
		assetIndex: 1,
		partIndex: 3,
		assigneeIndex: 2,
		tagIndex: 0,
		procedureIndex: null,
		assetProcedureIndex: null,
		recurrenceType: "none",
		recurrenceInterval: 0,
		recurrenceDayOfMonth: 0,
		recurrenceDays: null,
	},
	{
		title: "Boiler pressure check",
		description: "Weekly control of the pressure and of the safety valve",
		status: "planned",
		type: "preventive",
		priority: "medium",
		dayOffset: 0,
		startHour: 15,
		hours: 2,
		locationIndex: 0,
		assetIndex: 2,
		partIndex: 6,
		assigneeIndex: 3,
		tagIndex: 1,
		procedureIndex: 1,
		assetProcedureIndex: null,
		recurrenceType: "weekly",
		recurrenceInterval: 1,
		recurrenceDayOfMonth: 0,
		recurrenceDays: [1],
	},
	{
		title: "Filling line lubrication",
		description: "Lubrication route of the gearboxes of the filling line",
		status: "planned",
		type: "preventive",
		priority: "medium",
		dayOffset: 1,
		startHour: 8,
		hours: 3,
		locationIndex: 3,
		assetIndex: 1,
		partIndex: 4,
		assigneeIndex: 1,
		tagIndex: 0,
		procedureIndex: null,
		assetProcedureIndex: null,
		recurrenceType: "monthly_by_weekday",
		recurrenceInterval: 1,
		recurrenceDayOfMonth: 0,
		recurrenceDays: [2],
	},
	{
		title: "Forklift brake inspection",
		description: "The driver reports a long brake distance on the ramp",
		status: "pending",
		type: "reactive",
		priority: "low",
		dayOffset: 1,
		startHour: 11,
		hours: 1,
		locationIndex: 1,
		assetIndex: 3,
		partIndex: 9,
		assigneeIndex: 2,
		tagIndex: 1,
		procedureIndex: null,
		assetProcedureIndex: 2,
		recurrenceType: "none",
		recurrenceInterval: 0,
		recurrenceDayOfMonth: 0,
		recurrenceDays: null,
	},
	{
		title: "Cooling tower cleaning",
		description: "Cleaning and disinfection of the tower basin",
		status: "reviewing",
		type: "preventive",
		priority: "medium",
		dayOffset: 2,
		startHour: 9,
		hours: 4,
		locationIndex: 4,
		assetIndex: 4,
		partIndex: 5,
		assigneeIndex: 3,
		tagIndex: 2,
		procedureIndex: null,
		assetProcedureIndex: null,
		recurrenceType: "yearly",
		recurrenceInterval: 1,
		recurrenceDayOfMonth: 0,
		recurrenceDays: null,
	},
	{
		title: "Conveyor motor alignment",
		description: "The coupling shows vibration above the alarm level",
		status: "planned",
		type: "reactive",
		priority: "high",
		dayOffset: 3,
		startHour: 10,
		hours: 2,
		locationIndex: 3,
		assetIndex: 5,
		partIndex: 8,
		assigneeIndex: 1,
		tagIndex: 0,
		procedureIndex: null,
		assetProcedureIndex: null,
		recurrenceType: "none",
		recurrenceInterval: 0,
		recurrenceDayOfMonth: 0,
		recurrenceDays: null,
	},
	{
		title: "Generator load test",
		description: "Load test of the emergency generator with the yearly report",
		status: "completed",
		type: "preventive",
		priority: "high",
		dayOffset: -3,
		startHour: 9,
		hours: 3,
		locationIndex: 0,
		assetIndex: 7,
		partIndex: 7,
		assigneeIndex: 2,
		tagIndex: 1,
		procedureIndex: 3,
		assetProcedureIndex: 3,
		recurrenceType: "yearly",
		recurrenceInterval: 1,
		recurrenceDayOfMonth: 0,
		recurrenceDays: null,
	},
	{
		title: "Air dryer filter change",
		description: "Filter change after the pressure drop alarm",
		status: "completed",
		type: "preventive",
		priority: "low",
		dayOffset: -6,
		startHour: 14,
		hours: 1,
		locationIndex: 2,
		assetIndex: 6,
		partIndex: 1,
		assigneeIndex: 3,
		tagIndex: 0,
		procedureIndex: null,
		assetProcedureIndex: null,
		recurrenceType: "none",
		recurrenceInterval: 0,
		recurrenceDayOfMonth: 0,
		recurrenceDays: null,
	},
	{
		title: "Leak on hydraulic hose",
		description: "The repair went to the rental company under the contract",
		status: "cancelled",
		type: "reactive",
		priority: "medium",
		dayOffset: -8,
		startHour: 16,
		hours: 1,
		locationIndex: 1,
		assetIndex: 3,
		partIndex: 9,
		assigneeIndex: 1,
		tagIndex: 1,
		procedureIndex: null,
		assetProcedureIndex: null,
		recurrenceType: "none",
		recurrenceInterval: 0,
		recurrenceDayOfMonth: 0,
		recurrenceDays: null,
	},
] as const;

const attachmentSeeds = [
	{
		entityType: "asset",
		entityIndex: 0,
		fileName: "compressor-a1-manual.pdf",
		mimeType: "application/pdf",
		fileSize: 1843200,
	},
	{
		entityType: "asset",
		entityIndex: 7,
		fileName: "generator-load-curve.png",
		mimeType: "image/png",
		fileSize: 264150,
	},
	{
		entityType: "part",
		entityIndex: 1,
		fileName: "air-filter-a120-datasheet.pdf",
		mimeType: "application/pdf",
		fileSize: 412300,
	},
	{
		entityType: "location",
		entityIndex: 0,
		fileName: "north-plant-layout.png",
		mimeType: "image/png",
		fileSize: 738900,
	},
	{
		entityType: "workorder",
		entityIndex: 7,
		fileName: "generator-load-test-report.pdf",
		mimeType: "application/pdf",
		fileSize: 523400,
	},
] as const;

const trackSeeds = [
	{ memberIndex: 1, dayOffset: 0, latitude: 27.9445, longitude: -82.409 },
	{ memberIndex: 2, dayOffset: 0, latitude: 27.9448, longitude: -82.4085 },
	{ memberIndex: 3, dayOffset: 0, latitude: 28.452, longitude: -81.396 },
	{ memberIndex: 1, dayOffset: -1, latitude: 28.0006, longitude: -82.535 },
	{ memberIndex: 2, dayOffset: -1, latitude: 27.9445, longitude: -82.409 },
	{ memberIndex: 3, dayOffset: -2, latitude: 28.447, longitude: -81.401 },
] as const;

const trackPoints = (latitude: number, longitude: number, dayOffset: number) =>
	[8, 11, 14, 17].map((hour, step) => ({
		lat: latitude + step * 0.004,
		lng: longitude + step * 0.003,
		at: at(dayOffset, hour),
	}));

const tenantFor = (organizationId: number, userId: number): TenantContext => ({
	organizationId,
	userId,
	hasBackoffice: true,
	hasField: true,
	isOwner: true,
	timezone: TIMEZONE,
});

const seedOrganization = async (
	name: string,
	ownerId: number,
	memberIds: number[],
) => {
	const organizationId = await organizationsRepository.create(
		name,
		ownerId,
		"",
	);
	await organizationsRepository.addMember(
		organizationId,
		ownerId,
		true,
		true,
		db,
	);
	for (const [index, userId] of memberIds.entries()) {
		await organizationsRepository.addMember(
			organizationId,
			userId,
			!people[index + 1].field,
			true,
			db,
		);
		await organizationsRepository.updateMember(organizationId, userId, {
			workingHours,
		});
	}

	const tenant = tenantFor(organizationId, ownerId);

	for (const seed of invitationSeeds) {
		await invitationsRepository.create({
			email: seed.email,
			fullName: seed.fullName,
			organizationId,
			hasBackoffice: seed.backoffice,
			hasField: seed.field,
			token: randomBytes(32).toString("hex"),
			expiresAt: new Date(at(seed.expiresInDays, 12)),
			status: seed.status,
			inviterId: ownerId,
		});
	}

	const tags = {} as Record<TagType, number[]>;
	for (const [tagType, names] of Object.entries(tagSeeds)) {
		const ids = [];
		for (const tagName of names) {
			const tag = await tagsService.create(
				tenant,
				tagCreateSchema.parse({ name: tagName, tag_type: tagType }),
			);
			ids.push(tag.id);
		}
		tags[tagType as TagType] = ids;
	}

	const businesses = [];
	for (const seed of businessSeeds) {
		businesses.push(
			await businessesService.create(
				tenant,
				businessCreateSchema.parse({
					name: seed.name,
					tax_id: seed.taxId,
					type: seed.type,
					description: seed.description,
					phones: [{ number: seed.phone }],
					emails: [{ address: seed.email }],
				}),
			),
		);
	}

	const locations: LocationResponse[] = [];
	for (const seed of locationSeeds) {
		locations.push(
			await locationsService.create(
				tenant,
				locationCreateSchema.parse({
					name: seed.name,
					address: seed.address,
					city: seed.city,
					state: seed.state,
					postal_code: seed.postalCode,
					country: seed.country,
					latitude: seed.latitude,
					longitude: seed.longitude,
					parent_location_id:
						seed.parentIndex === null ? null : locations[seed.parentIndex].id,
					business_id:
						seed.businessIndex === null
							? null
							: businesses[seed.businessIndex].id,
					tag_ids: [tags.location[seed.tagIndex]],
					phones: [{ number: seed.phone }],
					emails: [{ address: seed.email }],
				}),
			),
		);
	}

	const assets: AssetResponse[] = [];
	for (const [index, seed] of assetSeeds.entries()) {
		assets.push(
			await assetsService.create(
				tenant,
				assetCreateSchema.parse({
					name: seed.name,
					serial_number: `SN-${1000 + index}`,
					model: seed.model,
					manufacturer: seed.manufacturer,
					description: seed.description,
					status: seed.status,
					criticality: seed.criticality,
					location_id: locations[seed.locationIndex].id,
					parent_asset_id:
						seed.parentIndex === null ? null : assets[seed.parentIndex].id,
					tag_ids: [tags.asset[seed.tagIndex]],
				}),
			),
		);
	}

	const parts = [];
	for (const seed of partSeeds) {
		parts.push(
			await partsService.create(
				tenant,
				partCreateSchema.parse({
					sku: seed.sku,
					name: seed.name,
					description: seed.description,
					quantity: seed.quantity,
					min_quantity: seed.min,
					unit_price: seed.unitPrice,
					currency: "USD",
					unit_of_measure: seed.uom,
					tag_ids: [tags.part[seed.tagIndex]],
				}),
			),
		);
	}

	const procedures = [];
	for (const seed of procedureSeeds) {
		procedures.push(
			await proceduresService.create(
				tenant,
				procedureCreateSchema.parse({
					name: seed.name,
					description: seed.description,
					status: seed.status,
					fields: seed.fields,
					tag_ids: [tags.procedure[seed.tagIndex]],
				}),
			),
		);
	}

	const workOrders = [];
	for (const seed of workOrderSeeds) {
		const assetProcedureIds =
			seed.assetProcedureIndex === null
				? []
				: [procedures[seed.assetProcedureIndex].id];
		const procedureIds =
			seed.procedureIndex === null ? [] : [procedures[seed.procedureIndex].id];

		const workOrder = await workOrdersService.create(
			tenant,
			workOrderCreateSchema.parse({
				title: seed.title,
				description: seed.description,
				status: seed.status,
				type: seed.type,
				priority: seed.priority,
				planned_start: at(seed.dayOffset, seed.startHour),
				planned_end: at(seed.dayOffset, seed.startHour + seed.hours),
				recurrence_type: seed.recurrenceType,
				recurrence_config: {
					interval: seed.recurrenceInterval,
					day_of_month: seed.recurrenceDayOfMonth,
					days_of_week: seed.recurrenceDays,
				},
				location_id: locations[seed.locationIndex].id,
				tag_ids: [tags.work_order[seed.tagIndex]],
				asset_assignments: [
					{
						asset_id: assets[seed.assetIndex].id,
						procedure_ids: assetProcedureIds,
					},
				],
				part_assignments: [
					{ part_id: parts[seed.partIndex].id, planned_quantity: 2 },
				],
				assignee_ids: [memberIds[seed.assigneeIndex]],
				procedure_ids: procedureIds,
			}),
		);
		workOrders.push(workOrder);

		if (seed.status !== "completed") continue;

		await workOrdersService.updatePart(
			tenant,
			workOrder.id,
			parts[seed.partIndex].id,
			2,
			2,
		);
		if (seed.procedureIndex !== null) {
			await workOrdersService.updateProcedure(
				tenant,
				workOrder.id,
				procedures[seed.procedureIndex].id,
				procedureSeeds[seed.procedureIndex].responses,
			);
		}
		if (seed.assetProcedureIndex !== null) {
			await workOrdersService.updateAssetProcedure(
				tenant,
				workOrder.id,
				assets[seed.assetIndex].id,
				procedures[seed.assetProcedureIndex].id,
				procedureSeeds[seed.assetProcedureIndex].responses,
			);
		}
	}

	const entities = {
		asset: assets,
		part: parts,
		location: locations,
		workorder: workOrders,
	};
	for (const seed of attachmentSeeds) {
		await attachmentsService.create(
			tenant,
			attachmentCreateSchema.parse({
				entity_type: seed.entityType,
				entity_id: entities[seed.entityType][seed.entityIndex].id,
				file_url: `${STORAGE_URL}/seed/${seed.fileName}`,
				file_name: seed.fileName,
				file_size: seed.fileSize,
				mime_type: seed.mimeType,
			}),
		);
	}

	await db.insert(tracks).values(
		trackSeeds.map((seed) => {
			const points = trackPoints(seed.latitude, seed.longitude, seed.dayOffset);
			const last = points[points.length - 1];
			return {
				userId: memberIds[seed.memberIndex],
				organizationId,
				trackDate: dateOnly(seed.dayOffset),
				track: points,
				lastLatitude: last.lat,
				lastLongitude: last.lng,
				lastTimestamp: new Date(last.at),
			};
		}),
	);

	await scheduleService.create(
		tenant,
		scheduleBlockCreateSchema.parse({
			user_id: memberIds[1],
			type: "break",
			start_time: at(0, 13),
			end_time: at(0, 14),
			note: "Lunch",
		}),
	);
	await scheduleService.create(
		tenant,
		scheduleBlockCreateSchema.parse({
			user_id: memberIds[2],
			type: "travel",
			start_time: at(0, 8),
			end_time: at(0, 9),
			note: "Drive to North Plant",
		}),
	);
	await scheduleService.create(
		tenant,
		scheduleBlockCreateSchema.parse({
			user_id: memberIds[0],
			type: "meeting",
			start_time: at(1, 10),
			end_time: at(1, 11),
			note: "Weekly planning with the plant manager",
		}),
	);
	await scheduleService.create(
		tenant,
		scheduleBlockCreateSchema.parse({
			user_id: memberIds[3],
			type: "block",
			start_time: at(2, 8),
			end_time: at(2, 12),
			note: "Training on the new filling line",
		}),
	);

	return organizationId;
};

const tableNames = Object.values(schema)
	.filter((value) => is(value, Table))
	.map((table) => `"${getTableName(table)}"`);

await db.execute(
	sql.raw(`truncate ${tableNames.join(", ")} restart identity cascade`),
);
console.log(`truncated ${tableNames.length} tables`);

const password = await hashPassword(PASSWORD);

const inserted = await db
	.insert(users)
	.values(
		[...people, outsider].map((person) => ({
			fullName: person.fullName,
			email: person.email,
			password,
			status: "active" as const,
			language: "en-US",
			timezone: TIMEZONE,
		})),
	)
	.returning({ id: users.id });

const ids = inserted.map((row) => row.id);
const ownerId = ids[0];
const memberIds = ids.slice(1, people.length);

const first = await seedOrganization(
	"Northwind Manufacturing",
	ownerId,
	memberIds,
);
const second = await seedOrganization("Harbor Facilities", ownerId, memberIds);

console.log(`organizations ${first} and ${second}`);
console.log(`login: ${people[0].email} / ${PASSWORD}`);
process.exit(0);
