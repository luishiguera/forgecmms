import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { getCurrentUser, updateCurrentUser } from "@/server/domains/users/fn";
import type {
	UserResponse,
	UserUpdateInput,
} from "@/server/domains/users/schema";
import { setUserTimezone } from "@/utils/format-date";

export const meQueryKey = ["me"];

export const meQueryOptions = () =>
	queryOptions({
		queryKey: meQueryKey,
		queryFn: async ({ signal }) => {
			const user = await getCurrentUser({ signal });
			setUserTimezone(user.timezone);
			return user;
		},
	});

export function useUpdateProfileMutation() {
	const queryClient = useQueryClient();

	return useMutation<UserResponse, Error, UserUpdateInput>({
		mutationFn: async (data) => {
			const user = await updateCurrentUser({ data });
			setUserTimezone(user.timezone);
			return user;
		},
		onSuccess: (user) => {
			queryClient.setQueryData(meQueryKey, user);
		},
	});
}
