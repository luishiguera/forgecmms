import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { Spinner } from "@/components/ui/spinner";
import * as m from "@/paraglide/messages";
import type { ImageUploadFieldProps } from "./types";

export function ImageUploadField({
	form,
	imageFieldName = "image_url",
	fallbackIcon: FallbackIcon,
	altText = "Image",
	onUpload,
	isUploading,
	onFieldChange,
	status,
	autoSubmit = false,
}: ImageUploadFieldProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const url = await onUpload(file);
		await new Promise<void>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve();
			img.onerror = () => reject();
			img.src = url;
		});
		setUploadedUrl(url);
		form.setFieldValue(imageFieldName, url);
		onFieldChange?.(imageFieldName);
		if (autoSubmit) {
			form.handleSubmit();
		}
	};

	const imageUrl = uploadedUrl ?? form.getFieldValue(imageFieldName);

	return (
		<div>
			<div className="flex items-center gap-1.5 mb-2">
				{status && <FieldStatusIndicator status={status} />}
			</div>
			<Avatar className="size-20">
				{isUploading ? (
					<AvatarFallback>
						<Spinner className="size-5" />
					</AvatarFallback>
				) : (
					<>
						<AvatarImage src={imageUrl} alt={altText} />
						<AvatarFallback>
							<FallbackIcon
								className="size-8 text-muted-foreground"
								weight="duotone"
							/>
						</AvatarFallback>
					</>
				)}
			</Avatar>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
			/>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="mt-2"
				onClick={() => fileInputRef.current?.click()}
				disabled={isUploading}
			>
				{isUploading ? m.shared_uploading() : m.shared_upload_image()}
			</Button>
		</div>
	);
}
