import { writeFile } from "node:fs/promises";
import { db } from "../src/server/db/client";
import type {
	FieldType,
	FormFieldConfig,
} from "../src/server/domains/procedures/schema";
import { newRenderCtx } from "../src/server/jobs/report/format";
import { renderReport } from "../src/server/jobs/report/render";
import type { OrgData, WorkOrderData } from "../src/server/jobs/report/schema";

const field = (
	id: string,
	type: FieldType,
	label: string,
): FormFieldConfig => ({ id, type, label, order: 0, validation: [] });

const sampleOrg: OrgData = {
	name: "ForgeCMMS demo",
	legalName: "ForgeCMMS Demo LLC",
	taxId: "59-1234567",
	address: "500 Water Street",
	city: "Tampa",
	state: "FL",
	postalCode: "33602",
	country: "United States",
	email: "hello@forgecmms.com",
	phone: "+1 813 555 0100",
};

const sampleWorkOrder: WorkOrderData = {
	id: 1042,
	title: "Quarterly compressor service",
	description: "Quarterly service with a filter change.",
	status: "completed",
	type: "preventive",
	priority: "high",
	plannedStart: "2026-08-10T07:00:00.000Z",
	plannedEnd: "2026-08-10T11:00:00.000Z",
	startedAt: "2026-08-10T07:12:00.000Z",
	closedAt: "2026-08-10T10:41:00.000Z",
	cancellationReason: "",
	location: {
		name: "North Plant",
		address: "4120 Adamo Drive",
		city: "Tampa",
		state: "FL",
		postalCode: "33605",
		country: "United States",
	},
	parts: [
		{ name: "Air filter A120", sku: "FLT-A120", quantity: 2, consumed: 2 },
		{ name: "Lubricant SAE 40", sku: "LUB-SAE40", quantity: 1, consumed: 1 },
	],
	assets: [
		{
			name: "Screw Compressor A1",
			serial: "SN-1000",
			status: "operational",
			procedures: [
				{
					name: "Visual inspection",
					fields: [
						field("f1", "short_text", "General condition"),
						field("f2", "toggle", "Leaks found"),
						{
							...field("f3", "rating", "Noise level"),
							rating_config: { max_rating: 5, icon: "star" },
						},
					],
					responses: { f1: "Correct", f2: false, f3: 4 },
				},
			],
		},
	],
	assignees: ["Mike Smith", "John Doe"],
	procedures: [
		{
			name: "Work order closing",
			fields: [
				field("g1", "number", "Machine hours"),
				{
					...field("g2", "matrix", "Final checklist"),
					matrix_config: {
						rows: ["Pressure", "Temperature"],
						columns: ["OK", "Fail"],
						allow_multiple: false,
					},
				},
				field("g3", "short_text", "Remarks"),
			],
			responses: {
				g1: 1284,
				g2: { Pressure: "OK", Temperature: "OK" },
				g3: "No incidents",
			},
		},
	],
};

const main = async () => {
	const locale = process.argv[2] ?? "en-US";
	const timezone = process.argv[3] ?? "America/New_York";

	const { buffer, warnings } = await renderReport(
		sampleOrg,
		sampleWorkOrder,
		undefined,
		newRenderCtx(locale, timezone),
	);

	const target = "report-preview.pdf";
	await writeFile(target, buffer);
	console.log(`wrote ${target} (${buffer.byteLength} bytes)`);
	for (const warning of warnings) console.warn(warning);

	await db.$client.end();
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
