import { useUploadMutation } from "@/lib/queries/upload";
import { useUpdateProfileMutation } from "@/lib/queries/user";
import { convertToWebP } from "@/utils/image";

export function useProfilePhoto(orgId: string, onBeforeSave?: () => void) {
	const uploadMutation = useUploadMutation();
	const updateProfileMutation = useUpdateProfileMutation();

	const upload = async (file: File) => {
		const webpFile = await convertToWebP(file);
		const result = await uploadMutation.mutateAsync({
			organizationId: orgId,
			file: webpFile,
			folder: "avatars",
		});
		await new Promise<void>((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve();
			image.onerror = () => reject();
			image.src = result.url;
		});
		onBeforeSave?.();
		await updateProfileMutation.mutateAsync({ photo_url: result.url });
	};

	return {
		upload,
		isUploading: uploadMutation.isPending,
		error: uploadMutation.error,
	};
}
