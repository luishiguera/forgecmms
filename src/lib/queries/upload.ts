import { useMutation } from "@tanstack/react-query";
import { deleteFile, uploadFile } from "@/server/domains/uploads/fn";

export interface UploadResponse {
	url: string;
	path: string;
}

export interface UploadParams {
	organizationId: string;
	file: File;
	folder?: string;
}

export interface DeleteFileParams {
	organizationId: string;
	path: string;
}

export function useUploadMutation() {
	return useMutation<UploadResponse, Error, UploadParams>({
		mutationFn: ({ organizationId, file, folder }) => {
			const formData = new FormData();
			formData.append("organization_id", organizationId);
			formData.append("file", file);
			if (folder) formData.append("folder", folder);
			return uploadFile({ data: formData });
		},
	});
}

export function useDeleteMutation() {
	return useMutation<void, Error, DeleteFileParams>({
		mutationFn: async ({ organizationId, path }) => {
			await deleteFile({ data: { organization_id: organizationId, path } });
		},
	});
}
