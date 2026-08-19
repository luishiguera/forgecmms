import { useMutation } from "@tanstack/react-query";
import {
	changePassword,
	forgotPassword,
	login,
	logout,
	resetPassword,
	signup,
} from "@/server/domains/auth/fn";
import type {
	ChangePasswordInput,
	ForgotPasswordInput,
	LoginInput,
	LoginResponse,
	ResetPasswordInput,
	SignupInput,
	SignupResponse,
} from "@/server/domains/auth/schema";

export function useSignupMutation() {
	return useMutation<SignupResponse, Error, SignupInput>({
		mutationFn: (data) => signup({ data }),
	});
}

export function useLoginMutation() {
	return useMutation<LoginResponse, Error, LoginInput>({
		mutationFn: (data) => login({ data }),
	});
}

export function useForgotPasswordMutation() {
	return useMutation<{ ok: boolean }, Error, ForgotPasswordInput>({
		mutationFn: (data) => forgotPassword({ data }),
	});
}

export function useResetPasswordMutation() {
	return useMutation<{ ok: boolean }, Error, ResetPasswordInput>({
		mutationFn: (data) => resetPassword({ data }),
	});
}

export function useLogoutMutation() {
	return useMutation({
		mutationFn: () => logout(),
	});
}

export function useChangePasswordMutation() {
	return useMutation<{ ok: boolean }, Error, ChangePasswordInput>({
		mutationFn: (data) => changePassword({ data }),
	});
}
