import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../db/client";
import { organizations, tracks, userOrganizations } from "../../db/schema";
import type { TenantContext } from "../../tenant";
import * as repository from "./repository";
import * as service from "./service";

let tenant: TenantContext;
let otherTenant: TenantContext;
let organizationId: number;
let userId: number;
let secondUserId: number;

const tenantFor = (organizationIdValue: number, userIdValue: number) => ({
	organizationId: organizationIdValue,
	userId: userIdValue,
	hasBackoffice: true,
	hasField: true,
	isOwner: true,
	timezone: "UTC",
});

beforeAll(async () => {
	const members = await db
		.select({
			organizationId: userOrganizations.organizationId,
			userId: userOrganizations.userId,
		})
		.from(userOrganizations)
		.where(isNull(userOrganizations.deletedAt));

	const grouped = new Map<number, number[]>();
	for (const row of members) {
		const list = grouped.get(row.organizationId) ?? [];
		list.push(row.userId);
		grouped.set(row.organizationId, list);
	}

	const pair = [...grouped.entries()].find(([, ids]) => ids.length >= 2);
	if (!pair)
		throw new Error("these tests need an organization with two members");

	organizationId = pair[0];
	[userId, secondUserId] = pair[1];

	const [other] = await db
		.select({ id: organizations.id })
		.from(organizations)
		.limit(2);

	tenant = tenantFor(organizationId, userId);
	otherTenant = tenantFor(
		other.id === organizationId ? organizationId : other.id,
		userId,
	);

	await db
		.delete(tracks)
		.where(
			and(
				eq(tracks.organizationId, organizationId),
				inArray(tracks.userId, [userId, secondUserId]),
			),
		);
});

afterAll(async () => {
	await db
		.delete(tracks)
		.where(
			and(
				eq(tracks.organizationId, organizationId),
				inArray(tracks.userId, [userId, secondUserId]),
			),
		);
});

describe("tracking service", () => {
	it("writes a point and reads back the same coordinates", async () => {
		await service.updateLocation(tenant, {
			latitude: 40.4168,
			longitude: -3.7038,
		});

		const result = await service.search(tenant, { page: 1, size: 50 });
		const mine = result.items.find((item) => item.user_id === userId);

		expect(mine).toBeDefined();
		expect(mine?.latitude).toBeCloseTo(40.4168, 6);
		expect(mine?.longitude).toBeCloseTo(-3.7038, 6);
		expect(mine?.full_name).toBeTruthy();
		expect(mine?.track_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(mine?.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("does not swap latitude and longitude on the way to the columns", async () => {
		await service.updateLocation(tenant, {
			latitude: 10,
			longitude: 20,
		});

		const [row] = await db
			.select({
				lat: tracks.lastLatitude,
				lng: tracks.lastLongitude,
			})
			.from(tracks)
			.where(
				and(
					eq(tracks.organizationId, organizationId),
					eq(tracks.userId, userId),
				),
			);

		expect(Number(row.lat)).toBeCloseTo(10, 6);
		expect(Number(row.lng)).toBeCloseTo(20, 6);
	});

	it("upserts the same day instead of inserting a second row", async () => {
		await service.updateLocation(tenant, { latitude: 1, longitude: 2 });
		await service.updateLocation(tenant, { latitude: 3, longitude: 4 });

		const rows = await db
			.select({ userId: tracks.userId })
			.from(tracks)
			.where(
				and(
					eq(tracks.organizationId, organizationId),
					eq(tracks.userId, userId),
				),
			);
		expect(rows).toHaveLength(1);

		const result = await service.search(tenant, { page: 1, size: 50 });
		const mine = result.items.find((item) => item.user_id === userId);
		expect(mine?.latitude).toBeCloseTo(3, 6);
		expect(mine?.longitude).toBeCloseTo(4, 6);
	});

	it("returns one row per user, the most recent day first", async () => {
		await repository.upsertLocation(organizationId, secondUserId, 5, 6);

		await db.execute(sql`
			INSERT INTO tracks (user_id, organization_id, track_date, last_latitude, last_longitude, last_timestamp)
			VALUES (${userId}, ${organizationId}, CURRENT_DATE - 1,
				88, 99, NOW() - interval '1 day')
			ON CONFLICT (user_id, organization_id, track_date) DO NOTHING
		`);

		const result = await service.search(tenant, { page: 1, size: 50 });
		const mineRows = result.items.filter((item) => item.user_id === userId);

		expect(mineRows).toHaveLength(1);
		expect(mineRows[0].latitude).not.toBeCloseTo(88, 6);
		expect(result.items.map((item) => item.user_id)).toContain(secondUserId);
	});

	it("counts distinct users, not rows", async () => {
		const result = await service.search(tenant, { page: 1, size: 50 });
		const distinctUsers = new Set(result.items.map((item) => item.user_id));
		expect(result.total).toBeGreaterThanOrEqual(distinctUsers.size);
		expect(result.total).toBe(
			new Set(
				(await service.search(tenant, { page: 1, size: 200 })).items.map(
					(item) => item.user_id,
				),
			).size,
		);
	});

	it("filters by user and by date range", async () => {
		const byUser = await service.search(tenant, {
			user_ids: [secondUserId],
			page: 1,
			size: 50,
		});
		expect(byUser.items.map((item) => item.user_id)).toEqual([secondUserId]);

		const future = await service.search(tenant, {
			track_date_from: "2999-01-01",
			page: 1,
			size: 50,
		});
		expect(future.items).toEqual([]);
		expect(future.total).toBe(0);
	});

	it("keeps another organization's tracks out", async () => {
		if (otherTenant.organizationId === organizationId) return;

		const result = await service.search(otherTenant, { page: 1, size: 50 });
		expect(result.items.map((item) => item.user_id)).not.toContain(userId);
	});
});
