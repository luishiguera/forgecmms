import { db, toISO } from "../../db/client";
import { forbidden, notFound } from "../../errors";
import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import type { MemberRow, OrganizationRow } from "./repository";
import * as repository from "./repository";
import type {
	Access,
	MemberResponse,
	MemberSearchParams,
	MemberUpdateInput,
	OrganizationCreateInput,
	OrganizationResponse,
	OrganizationUpdateInput,
} from "./schema";

const accessList = (hasBackoffice: boolean, hasField: boolean): Access[] => {
	const list: Access[] = [];
	if (hasBackoffice) list.push("backoffice");
	if (hasField) list.push("field");
	return list;
};

const toResponse = (
	row: OrganizationRow,
	accesses: Access[],
	isOwner: boolean,
): OrganizationResponse => ({
	id: row.id,
	name: row.name,
	logo_url: row.logoUrl,
	legal_name: row.legalName,
	tax_id: row.taxId,
	address: row.address,
	city: row.city,
	state: row.state,
	postal_code: row.postalCode,
	country: row.country,
	email: row.email,
	phone: row.phone,
	accesses,
	is_owner: isOwner,
	created_at: toISO(row.createdAt),
});

const toMemberResponse = (row: MemberRow, ownerId: number): MemberResponse => ({
	user_id: row.id,
	full_name: row.fullName,
	photo_url: row.photoUrl,
	email: row.email,
	accesses: accessList(row.hasBackoffice, row.hasField),
	working_hours: row.workingHours,
	is_owner: row.id === ownerId,
	created_at: toISO(row.createdAt),
});

export const get = async (tc: TenantContext): Promise<OrganizationResponse> => {
	const row = await repository.get(tc.organizationId);
	if (!row) throw notFound();

	return toResponse(row, accessList(tc.hasBackoffice, tc.hasField), tc.isOwner);
};

export const create = async (
	userId: number,
	input: OrganizationCreateInput,
): Promise<{ id: number }> => {
	const organizationId = await db.transaction(async (tx) => {
		const id = await repository.create(
			input.name,
			userId,
			input.logo_url ?? "",
			tx,
		);
		await repository.addMember(id, userId, true, true, tx);
		return id;
	});

	return { id: organizationId };
};

export const update = async (
	tc: TenantContext,
	input: OrganizationUpdateInput,
): Promise<OrganizationResponse> => {
	const patch: repository.OrganizationPatch = {};

	if (input.name !== undefined) patch.name = input.name;
	if (input.logo_url !== undefined) patch.logoUrl = input.logo_url;
	if (input.legal_name !== undefined) patch.legalName = input.legal_name;
	if (input.tax_id !== undefined) patch.taxId = input.tax_id;
	if (input.address !== undefined) patch.address = input.address;
	if (input.city !== undefined) patch.city = input.city;
	if (input.state !== undefined) patch.state = input.state;
	if (input.postal_code !== undefined) patch.postalCode = input.postal_code;
	if (input.country !== undefined) patch.country = input.country;
	if (input.email !== undefined) patch.email = input.email;
	if (input.phone !== undefined) patch.phone = input.phone;

	await repository.update(tc.organizationId, patch);
	return get(tc);
};

export const listForUser = async (
	userId: number,
): Promise<OrganizationResponse[]> => {
	const rows = await repository.listForUser(userId);
	return rows.map((row) =>
		toResponse(
			row,
			accessList(row.hasBackoffice, row.hasField),
			row.ownerId === userId,
		),
	);
};

export const getMember = async (
	tc: TenantContext,
	memberId: number,
): Promise<MemberResponse> => {
	const organization = await repository.get(tc.organizationId);
	if (!organization) throw notFound();

	const row = await repository.getMember(tc.organizationId, memberId);
	if (!row) throw notFound();

	return toMemberResponse(row, organization.ownerId);
};

export const searchMembers = async (
	tc: TenantContext,
	params: MemberSearchParams,
): Promise<Paginated<MemberResponse>> => {
	const organization = await repository.get(tc.organizationId);
	if (!organization) throw notFound();

	const { rows, total } = await repository.searchMembers(
		tc.organizationId,
		params,
	);

	return paginate(
		rows.map((row) => toMemberResponse(row, organization.ownerId)),
		params,
		total,
	);
};

export const updateMember = async (
	tc: TenantContext,
	memberId: number,
	input: MemberUpdateInput,
) => {
	const organization = await repository.get(tc.organizationId);
	if (!organization) throw notFound();

	if (input.accesses !== undefined && !tc.isOwner) throw forbidden();
	if (input.accesses !== undefined && memberId === organization.ownerId) {
		throw forbidden();
	}

	const patch: Parameters<typeof repository.updateMember>[2] = {};

	if (input.accesses !== undefined) {
		patch.hasBackoffice = input.accesses.includes("backoffice");
		patch.hasField = input.accesses.includes("field");
	}
	if (input.working_hours !== undefined) {
		patch.workingHours = input.working_hours;
	}

	await repository.updateMember(tc.organizationId, memberId, patch);
};

export const removeMember = async (tc: TenantContext, memberId: number) => {
	const organization = await repository.get(tc.organizationId);
	if (!organization) throw notFound();

	if (!tc.isOwner) throw forbidden();
	if (memberId === organization.ownerId) throw forbidden();

	await repository.removeMember(tc.organizationId, memberId, tc.userId);
};
