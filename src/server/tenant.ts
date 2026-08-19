import { and, eq, isNull } from "drizzle-orm";
import { db, type IDB } from "./db/client";
import { organizations, userOrganizations, users } from "./db/schema";
import { forbidden } from "./errors";

export type TenantContext = {
	organizationId: number;
	userId: number;
	hasBackoffice: boolean;
	hasField: boolean;
	isOwner: boolean;
	timezone: string;
};

export type Access = "backoffice" | "field" | "any";

export const resolveTenant = async (
	userId: number,
	organizationId: number,
	access: Access = "any",
	dbc: IDB = db,
): Promise<TenantContext> => {
	const [membership] = await dbc
		.select({
			hasBackoffice: userOrganizations.hasBackoffice,
			hasField: userOrganizations.hasField,
			ownerId: organizations.ownerId,
			timezone: users.timezone,
		})
		.from(userOrganizations)
		.innerJoin(users, eq(users.id, userOrganizations.userId))
		.innerJoin(
			organizations,
			eq(organizations.id, userOrganizations.organizationId),
		)
		.where(
			and(
				eq(userOrganizations.organizationId, organizationId),
				eq(userOrganizations.userId, userId),
				isNull(userOrganizations.deletedAt),
			),
		)
		.limit(1);

	if (!membership) throw forbidden();

	const granted =
		access === "backoffice"
			? membership.hasBackoffice
			: access === "field"
				? membership.hasField
				: membership.hasBackoffice || membership.hasField;
	if (!granted) throw forbidden();

	return {
		organizationId,
		userId,
		hasBackoffice: membership.hasBackoffice,
		hasField: membership.hasField,
		isOwner: membership.ownerId === userId,
		timezone: membership.timezone,
	};
};
