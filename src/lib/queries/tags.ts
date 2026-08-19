import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import * as m from "@/paraglide/messages";
import type { TagResponse } from "@/server/domains/_shared/schema";
import { setAssetTags } from "@/server/domains/assets/fn";
import { setLocationTags } from "@/server/domains/locations/fn";
import { setPartTags } from "@/server/domains/parts/fn";
import { setProcedureTags } from "@/server/domains/procedures/fn";
import {
	createTag,
	deleteTag,
	listTags,
	updateTag,
} from "@/server/domains/tags/fn";
import type { TagType } from "@/server/domains/tags/schema";
import { setWorkOrderTags } from "@/server/domains/workorders/fn";
import { mapError } from "./errors";
import { entityKeys } from "./keys";

const tagSetters = {
	assets: (orgId: string, entityId: number, tagIds: number[]) =>
		setAssetTags({
			data: { organization_id: orgId, asset_id: entityId, tag_ids: tagIds },
		}),
	locations: (orgId: string, entityId: number, tagIds: number[]) =>
		setLocationTags({
			data: { organization_id: orgId, location_id: entityId, tag_ids: tagIds },
		}),
	parts: (orgId: string, entityId: number, tagIds: number[]) =>
		setPartTags({
			data: { organization_id: orgId, part_id: entityId, tag_ids: tagIds },
		}),
	procedures: (orgId: string, entityId: number, tagIds: number[]) =>
		setProcedureTags({
			data: { organization_id: orgId, procedure_id: entityId, tag_ids: tagIds },
		}),
	"work-orders": (orgId: string, entityId: number, tagIds: number[]) =>
		setWorkOrderTags({
			data: {
				organization_id: orgId,
				work_order_id: entityId,
				tag_ids: tagIds,
			},
		}),
} as const;

export type TagEntityPath = keyof typeof tagSetters;

export const tagsQueryOptions = (orgId: string, type: TagType) =>
	queryOptions({
		queryKey: ["organization", orgId, "tags", type],
		queryFn: ({ signal }) =>
			listTags({ signal, data: { organization_id: orgId, tag_type: type } }),
		staleTime: 30 * 1000,
	});

export function useCreateTagMutation(orgId: string, type: TagType) {
	const queryClient = useQueryClient();
	return useMutation<TagResponse, Error, { name: string }>({
		mutationFn: ({ name }) =>
			mapError("conflict", m.error_tag_duplicate(), () =>
				createTag({
					data: { organization_id: orgId, name, tag_type: type },
				}),
			),
		onSuccess: (newTag) => {
			queryClient.setQueryData<TagResponse[]>(
				["organization", orgId, "tags", type],
				(old) => {
					if (!old) return old;
					if (old.some((t) => t.id === newTag.id)) return old;
					return [...old, newTag];
				},
			);
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "tags", type],
			});
		},
	});
}

export function useUpdateTagMutation(orgId: string, type: TagType) {
	const queryClient = useQueryClient();
	return useMutation<
		TagResponse,
		Error,
		{ tagId: number; data: { name?: string } }
	>({
		mutationFn: ({ tagId, data }) =>
			mapError("conflict", m.error_tag_duplicate(), () =>
				updateTag({ data: { organization_id: orgId, tag_id: tagId, data } }),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "tags", type],
			});
		},
	});
}

export function useSetEntityTagsMutation(
	orgId: string,
	entityPath: TagEntityPath,
	entityId: number,
	tagType: TagType,
) {
	const queryClient = useQueryClient();
	const entityKey = entityKeys(entityPath).detail(orgId, entityId);
	const tagsKey = ["organization", orgId, "tags", tagType];
	return useMutation<
		void,
		Error,
		number[],
		{ previous: { tags: TagResponse[] } | undefined }
	>({
		mutationFn: async (tagIds) => {
			await tagSetters[entityPath](orgId, entityId, tagIds);
		},
		onMutate: async (tagIds) => {
			await queryClient.cancelQueries({ queryKey: entityKey });
			const previous = queryClient.getQueryData<{ tags: TagResponse[] }>(
				entityKey,
			);
			const allTags = queryClient.getQueryData<TagResponse[]>(tagsKey) ?? [];
			queryClient.setQueryData<{ tags: TagResponse[] }>(entityKey, (old) => {
				if (!old) return old;
				const byId = new Map<number, TagResponse>(
					old.tags.map((t) => [t.id, t]),
				);
				for (const t of allTags) byId.set(t.id, t);
				const nextTags = tagIds
					.map((id) => byId.get(id))
					.filter((t): t is TagResponse => Boolean(t));
				return { ...old, tags: nextTags };
			});
			return { previous };
		},
		onError: (_err, _vars, context) => {
			if (context?.previous) {
				queryClient.setQueryData(entityKey, context.previous);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: entityKey });
		},
	});
}

export function useDeleteTagMutation(
	orgId: string,
	type: TagType,
	domainKey: string,
) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: async (tagId) => {
			await deleteTag({ data: { organization_id: orgId, tag_id: tagId } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "tags", type],
			});
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, domainKey],
			});
		},
	});
}
