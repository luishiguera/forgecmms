import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createOrganization,
	getMember,
	getOrganization,
	listMyOrganizations,
	removeMember,
	searchMembers,
	updateMember,
	updateOrganization,
} from "@/server/domains/organizations/fn";
import type {
	MemberSearchPayload,
	MemberUpdateInput,
	OrganizationCreateInput,
	OrganizationResponse,
	OrganizationUpdateInput,
} from "@/server/domains/organizations/schema";

export const organizationsQueryOptions = () =>
	queryOptions({
		queryKey: ["organizations"],
		queryFn: ({ signal }) => listMyOrganizations({ signal }),
		retry: 1,
		throwOnError: true,
	});

export const organizationQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["organization", id],
		queryFn: ({ signal }) =>
			getOrganization({ signal, data: { organization_id: id } }),
		retry: 1,
		throwOnError: true,
	});

export function useUpdateOrganizationMutation(id: string) {
	const queryClient = useQueryClient();
	return useMutation<OrganizationResponse, Error, OrganizationUpdateInput>({
		mutationFn: (data) =>
			updateOrganization({ data: { organization_id: id, ...data } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["organization", id] });
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
		},
	});
}

export const organizationMembersQueryOptions = (
	orgId: string,
	params: MemberSearchPayload,
) =>
	queryOptions({
		queryKey: ["organization", orgId, "members", params],
		queryFn: ({ signal }) =>
			searchMembers({ signal, data: { organization_id: orgId, ...params } }),
	});

export const memberQueryOptions = (orgId: string, memberId: number) =>
	queryOptions({
		queryKey: ["organization", orgId, "members", "detail", memberId],
		queryFn: ({ signal }) =>
			getMember({
				signal,
				data: { organization_id: orgId, member_id: memberId },
			}),
	});

export function useUpdateMemberMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, { userId: number; data: MemberUpdateInput }>({
		mutationFn: async ({ userId, data }) => {
			await updateMember({
				data: { organization_id: orgId, member_id: userId, data },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "members"],
			});
		},
	});
}

export function useRemoveMemberMutation(orgId: string) {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: async (userId) => {
			await removeMember({
				data: { organization_id: orgId, member_id: userId },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization", orgId, "members"],
			});
		},
	});
}

export function useCreateOrganizationMutation() {
	return useMutation({
		mutationFn: (data: OrganizationCreateInput) => createOrganization({ data }),
	});
}
