import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	acceptInvitation,
	cancelInvitation,
	createInvitation,
	getInvitationDetails,
	searchInvitations,
} from "@/server/domains/invitations/fn";
import type {
	InvitationCreateInput,
	InvitationDetailsResponse,
	InvitationSearchPayload,
} from "@/server/domains/invitations/schema";

export function useInvitationDetailsQuery(token: string) {
	return useQuery<InvitationDetailsResponse, Error>({
		queryKey: ["invitation", token],
		queryFn: ({ signal }) => getInvitationDetails({ signal, data: { token } }),
		enabled: !!token && token.length === 64,
		retry: false,
		throwOnError: false,
	});
}

export function useAcceptInvitationMutation(token: string) {
	return useMutation<void, Error, { password?: string }>({
		mutationFn: async ({ password }) => {
			await acceptInvitation({ data: { token, password } });
		},
	});
}

export function useCreateInvitationMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, InvitationCreateInput>({
		mutationFn: async (data) => {
			await createInvitation({ data: { organization_id: orgId, ...data } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "members"],
			});
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "invitations"],
			});
		},
	});
}

export const organizationInvitationsQueryOptions = (
	orgId: string,
	params: InvitationSearchPayload,
) =>
	queryOptions({
		queryKey: ["organization", orgId, "invitations", params],
		queryFn: ({ signal }) =>
			searchInvitations({
				signal,
				data: { organization_id: orgId, ...params },
			}),
	});

export function useCancelInvitationMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: async (invitationId) => {
			await cancelInvitation({
				data: { organization_id: orgId, invitation_id: invitationId },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "invitations"],
			});
		},
	});
}
