import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createAttachment,
	deleteAttachment,
	listAttachments,
} from "@/server/domains/attachments/fn";
import type {
	AttachmentCreatePayload,
	AttachmentEntityType,
	AttachmentResponse,
} from "@/server/domains/attachments/schema";

export type EntityType = AttachmentEntityType;

export const attachmentsQueryOptions = (
	orgId: string,
	entityType: EntityType,
	entityId: number,
) =>
	queryOptions({
		queryKey: ["organization", orgId, "attachments", entityType, entityId],
		queryFn: ({ signal }) =>
			listAttachments({
				signal,
				data: {
					organization_id: orgId,
					entity_type: entityType,
					entity_id: entityId,
				},
			}),
		enabled: !!entityId,
	});

export function useCreateAttachmentMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<AttachmentResponse, Error, AttachmentCreatePayload>({
		mutationFn: (data) =>
			createAttachment({ data: { organization_id: orgId, ...data } }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [
					"organization",
					orgId,
					"attachments",
					variables.entity_type,
					variables.entity_id,
				],
			});
		},
	});
}

export function useDeleteAttachmentMutation(
	orgId: string,
	entityType: EntityType,
	entityId: number,
) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: async (attachmentId) => {
			await deleteAttachment({
				data: { organization_id: orgId, attachment_id: attachmentId },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "attachments", entityType, entityId],
			});
		},
	});
}
