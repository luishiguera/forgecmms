import { and, eq, inArray, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import {
	organizations,
	procedures,
	tagAssignments,
	tags,
	userOrganizations,
} from "../../db/schema";
import { errorCodeOf } from "../../errors";
import type { TenantContext } from "../../tenant";
import { type ProcedureFields, procedureFieldsSchema } from "./schema";
import * as service from "./service";

let tenant: TenantContext;
let otherTenant: TenantContext;
let tagId: number;
const createdProcedureIds: number[] = [];

const suffix = process.hrtime.bigint().toString().slice(-9);
let sequence = 0;
const uniqueName = (label: string) =>
	`zz-test-${label}-${suffix}-${++sequence}`;

const sampleFields: ProcedureFields = [
	{
		nodeType: "field",
		id: "f1",
		type: "short_text",
		label: "Reading",
		order: 0,
		validation: [{ type: "required", message: "Reading is required" }],
	},
	{
		nodeType: "embed",
		id: "e1",
		type: "note",
		label: "Note",
		order: 1,
		src: "",
		alt: "",
		caption: "",
		noteVariant: "info",
		noteContent: "Wear gloves",
	},
	{
		nodeType: "field",
		id: "f2",
		type: "signature",
		label: "Technician",
		order: 2,
		validation: [],
	},
];

const codeOfRejection = async (run: () => Promise<unknown>) => {
	try {
		await run();
		return "no-rejection";
	} catch (error) {
		return errorCodeOf(error) ?? "unknown-error";
	}
};

const tenantFor = (organizationId: number, userId: number): TenantContext => ({
	organizationId,
	userId,
	hasBackoffice: true,
	hasField: true,
	isOwner: true,
	timezone: "UTC",
});

beforeAll(async () => {
	const orgs = await db
		.select({ id: organizations.id, ownerId: organizations.ownerId })
		.from(organizations)
		.innerJoin(
			userOrganizations,
			and(
				eq(userOrganizations.organizationId, organizations.id),
				eq(userOrganizations.userId, organizations.ownerId),
				isNull(userOrganizations.deletedAt),
			),
		)
		.limit(2);

	if (orgs.length < 2) {
		throw new Error("these tests need at least two organizations");
	}

	tenant = tenantFor(orgs[0].id, orgs[0].ownerId);
	otherTenant = tenantFor(orgs[1].id, orgs[1].ownerId);

	const [tag] = await db
		.insert(tags)
		.values({
			organizationId: tenant.organizationId,
			tagType: "procedure",
			name: uniqueName("tag"),
		})
		.returning({ id: tags.id });
	tagId = tag.id;
});

afterAll(async () => {
	if (createdProcedureIds.length > 0) {
		await db
			.delete(tagAssignments)
			.where(inArray(tagAssignments.entityId, createdProcedureIds));
		await db
			.delete(procedures)
			.where(inArray(procedures.id, createdProcedureIds));
	}
	if (tagId) await db.delete(tags).where(eq(tags.id, tagId));
});

const createProcedure = async (overrides: Record<string, unknown> = {}) => {
	const procedure = await service.create(tenant, {
		name: uniqueName("procedure"),
		description: "",
		status: "draft",
		fields: sampleFields,
		...overrides,
	} as Parameters<typeof service.create>[1]);
	createdProcedureIds.push(procedure.id);
	return procedure;
};

describe("procedure block schema", () => {
	it("accepts a field block and an embed block", () => {
		expect(procedureFieldsSchema.parse(sampleFields)).toEqual(sampleFields);
	});

	it("rejects a block with no nodeType", () => {
		const result = procedureFieldsSchema.safeParse([
			{ id: "f1", type: "short_text", label: "Reading" },
		]);
		expect(result.success).toBe(false);
	});

	it("rejects an unknown field type", () => {
		const result = procedureFieldsSchema.safeParse([
			{ nodeType: "field", id: "f1", type: "text", label: "Reading" },
		]);
		expect(result.success).toBe(false);
	});

	it("rejects an embed that carries no source", () => {
		const result = procedureFieldsSchema.safeParse([
			{ nodeType: "embed", id: "e1", type: "image", label: "Diagram" },
		]);
		expect(result.success).toBe(false);
	});

	it("fills the order and the validation list of a field", () => {
		const parsed = procedureFieldsSchema.parse([
			{ nodeType: "field", id: "f1", type: "short_text", label: "Reading" },
		]);
		expect(parsed[0]).toMatchObject({ order: 0, validation: [] });
	});
});

describe("procedures service", () => {
	it("round trips the fields jsonb without altering it", async () => {
		const procedure = await createProcedure({ tag_ids: [tagId] });

		expect(procedure.fields).toEqual(sampleFields);
		expect(procedure.status).toBe("draft");
		expect(procedure.uses_count).toBe(0);
		expect(procedure.tags.map((tag) => tag.id)).toEqual([tagId]);
		expect(procedure.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(procedure.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("accepts an empty field list", async () => {
		const procedure = await createProcedure({ fields: [] });
		expect(procedure.fields).toEqual([]);
	});

	it("replaces the whole field list on update", async () => {
		const created = await createProcedure();
		const replacement: ProcedureFields = [
			{
				nodeType: "field",
				id: "f3",
				type: "number",
				label: "Pressure",
				order: 0,
				validation: [],
			},
		];

		const updated = await service.update(tenant, created.id, {
			fields: replacement,
		});
		expect(updated.fields).toEqual(replacement);
	});

	it("leaves the fields alone when the update omits them", async () => {
		const created = await createProcedure();
		const updated = await service.update(tenant, created.id, {
			status: "active",
		});

		expect(updated.status).toBe("active");
		expect(updated.fields).toEqual(sampleFields);
	});

	it("filters by status", async () => {
		const draft = await createProcedure({ status: "draft" });
		const archived = await createProcedure({ status: "archived" });

		const result = await service.search(tenant, {
			q: `zz-test-procedure-${suffix}`,
			status: "archived",
			page: 1,
			size: 50,
		});

		const ids = result.items.map((item) => item.id);
		expect(ids).toContain(archived.id);
		expect(ids).not.toContain(draft.id);
	});

	it("orders search by most recently updated first", async () => {
		const older = await createProcedure();
		const newer = await createProcedure();

		await service.update(tenant, older.id, { description: "touched last" });

		const result = await service.search(tenant, {
			q: `zz-test-procedure-${suffix}`,
			page: 1,
			size: 50,
		});

		const ids = result.items.map((item) => item.id);
		expect(ids.indexOf(older.id)).toBeLessThan(ids.indexOf(newer.id));
	});

	it("hides procedures from another organization", async () => {
		const created = await createProcedure();
		expect(
			await codeOfRejection(() => service.get(otherTenant, created.id)),
		).toBe("not_found");
	});

	it("soft deletes and then reports not found", async () => {
		const created = await createProcedure();
		await service.remove(tenant, created.id);

		expect(await codeOfRejection(() => service.get(tenant, created.id))).toBe(
			"not_found",
		);
	});
});
