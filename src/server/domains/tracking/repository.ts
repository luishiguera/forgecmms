import { type SQL, sql } from "drizzle-orm";
import { db, type IDB } from "../../db/client";
import { tracks } from "../../db/schema";
import type { TrackLocationResponse, TrackSearchParams } from "./schema";

export const upsertLocation = async (
	organizationId: number,
	userId: number,
	latitude: number,
	longitude: number,
	dbc: IDB = db,
) => {
	await dbc
		.insert(tracks)
		.values({
			userId,
			organizationId,
			trackDate: sql`CURRENT_DATE`,
			lastLatitude: latitude,
			lastLongitude: longitude,
		})
		.onConflictDoUpdate({
			target: [tracks.userId, tracks.organizationId, tracks.trackDate],
			set: {
				lastLatitude: latitude,
				lastLongitude: longitude,
				lastTimestamp: sql`NOW()`,
			},
		});
};

const filters = (organizationId: number, params: TrackSearchParams): SQL => {
	const parts: SQL[] = [sql`t.organization_id = ${organizationId}`];

	if (params.track_date_from) {
		parts.push(sql`t.track_date >= ${params.track_date_from}`);
	}
	if (params.track_date_to) {
		parts.push(sql`t.track_date <= ${params.track_date_to}`);
	}
	if (params.user_ids?.length) {
		parts.push(
			sql`t.user_id IN (${sql.join(
				params.user_ids.map((id) => sql`${id}`),
				sql`, `,
			)})`,
		);
	}

	return sql.join(parts, sql` AND `);
};

export const searchTracks = async (
	organizationId: number,
	params: TrackSearchParams,
	dbc: IDB = db,
) => {
	const where = filters(organizationId, params);

	const counted = await dbc.execute<{ total: number }>(sql`
		SELECT COUNT(DISTINCT t.user_id)::int AS total FROM tracks t WHERE ${where}
	`);

	const listed = await dbc.execute<TrackLocationResponse>(sql`
		SELECT DISTINCT ON (t.user_id)
			t.user_id,
			u.full_name,
			u.photo_url,
			u.email,
			t.last_latitude AS latitude,
			t.last_longitude AS longitude,
			t.track_date::text AS track_date,
			t.last_timestamp AS updated_at
		FROM tracks t
		JOIN users u ON u.id = t.user_id
		WHERE ${where}
		ORDER BY t.user_id, t.track_date DESC
		LIMIT ${params.size} OFFSET ${(params.page - 1) * params.size}
	`);

	return {
		rows: listed.rows,
		total: counted.rows[0]?.total ?? 0,
	};
};
