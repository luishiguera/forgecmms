import { toISO } from "../../db/client";
import { notFound } from "../../errors";
import type { UserRow } from "./repository";
import * as repository from "./repository";
import type { UserResponse, UserUpdateInput } from "./schema";

const toResponse = (row: UserRow): UserResponse => ({
	id: row.id,
	email: row.email,
	full_name: row.fullName,
	photo_url: row.photoUrl,
	language: row.language,
	timezone: row.timezone,
	created_at: toISO(row.createdAt),
});

export const get = async (userId: number): Promise<UserResponse> => {
	const row = await repository.get(userId);
	if (!row) throw notFound();
	return toResponse(row);
};

export const update = async (
	userId: number,
	input: UserUpdateInput,
): Promise<UserResponse> => {
	const patch: repository.UserPatch = {};

	if (input.full_name !== undefined) patch.fullName = input.full_name;
	if (input.photo_url !== undefined) patch.photoUrl = input.photo_url;
	if (input.language !== undefined) patch.language = input.language;
	if (input.timezone !== undefined) patch.timezone = input.timezone;

	const row = await repository.update(userId, patch);
	return toResponse(row);
};
