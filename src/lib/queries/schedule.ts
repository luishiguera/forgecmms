import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createScheduleBlock,
	deleteScheduleBlock,
	searchScheduleBlocks,
	updateScheduleBlock,
} from "@/server/domains/schedule/fn";
import type {
	ScheduleBlockCreatePayload,
	ScheduleBlockResponse,
	ScheduleBlockUpdateInput,
	ScheduleSearchPayload,
} from "@/server/domains/schedule/schema";
import { entityKeys } from "./keys";

export const scheduleKeys = entityKeys("schedule");

export const scheduleBlocksQueryOptions = (
	orgId: string,
	params: ScheduleSearchPayload,
) =>
	queryOptions({
		queryKey: scheduleKeys.list(orgId, params),
		queryFn: ({ signal }) =>
			searchScheduleBlocks({
				signal,
				data: { organization_id: orgId, ...params },
			}),
	});

export function useCreateScheduleBlockMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<ScheduleBlockResponse, Error, ScheduleBlockCreatePayload>({
		mutationFn: (data) =>
			createScheduleBlock({ data: { organization_id: orgId, ...data } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: scheduleKeys.lists(orgId) });
		},
	});
}

export function useUpdateScheduleBlockMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<
		ScheduleBlockResponse,
		Error,
		{ blockId: number; data: ScheduleBlockUpdateInput }
	>({
		mutationFn: ({ blockId, data }) =>
			updateScheduleBlock({
				data: { organization_id: orgId, block_id: blockId, data },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: scheduleKeys.lists(orgId) });
		},
	});
}

export function useDeleteScheduleBlockMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: async (blockId) => {
			await deleteScheduleBlock({
				data: { organization_id: orgId, block_id: blockId },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: scheduleKeys.lists(orgId) });
		},
	});
}
