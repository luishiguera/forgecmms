import type { TenantContext } from "../../tenant";
import { type Paginated, paginate } from "../_shared/schema";
import * as repository from "./repository";
import type {
	TrackLocationResponse,
	TrackSearchParams,
	TrackUpdateInput,
} from "./schema";

export const updateLocation = async (
	tc: TenantContext,
	input: TrackUpdateInput,
) => {
	await repository.upsertLocation(
		tc.organizationId,
		tc.userId,
		input.latitude,
		input.longitude,
	);
};

export const search = async (
	tc: TenantContext,
	params: TrackSearchParams,
): Promise<Paginated<TrackLocationResponse>> => {
	const { rows, total } = await repository.searchTracks(
		tc.organizationId,
		params,
	);

	return paginate(
		rows.map((row) => ({
			user_id: Number(row.user_id),
			full_name: row.full_name,
			photo_url: row.photo_url,
			email: row.email,
			latitude: Number(row.latitude),
			longitude: Number(row.longitude),
			track_date: row.track_date,
			updated_at: new Date(row.updated_at).toISOString(),
		})),
		params,
		total,
	);
};
