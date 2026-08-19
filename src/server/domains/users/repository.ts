import { eq, sql } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { users } from "../../db/schema";
import { notFound } from "../../errors";

const columns = {
	id: users.id,
	email: users.email,
	fullName: users.fullName,
	photoUrl: users.photoUrl,
	language: users.language,
	timezone: users.timezone,
	createdAt: users.createdAt,
};

export type UserPatch = Partial<{
	fullName: string;
	photoUrl: string;
	language: string;
	timezone: string;
}>;

export const get = async (id: number, dbc: IDB = db) => {
	const [row] = await dbc
		.select(columns)
		.from(users)
		.where(eq(users.id, id))
		.limit(1);

	return row;
};

export const update = async (id: number, patch: UserPatch, dbc: IDB = db) => {
	const [row] = await dbc
		.update(users)
		.set({ ...patch, updatedAt: sql`NOW()` })
		.where(eq(users.id, id))
		.returning(columns);

	if (!row) throw notFound();
	return row;
};

export type UserRow = NonNullable<Awaited<ReturnType<typeof get>>>;
