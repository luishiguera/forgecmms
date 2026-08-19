import { DownloadSimple as DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { ImageIcon } from "@phosphor-icons/react/dist/csr/Image";
import { UploadIcon } from "@phosphor-icons/react/dist/csr/Upload";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import type { EntityType } from "@/lib/queries/attachments";
import {
	attachmentsQueryOptions,
	useCreateAttachmentMutation,
	useDeleteAttachmentMutation,
} from "@/lib/queries/attachments";
import { useUploadMutation } from "@/lib/queries/upload";
import * as m from "@/paraglide/messages";
import type { AttachmentResponse } from "@/server/domains/attachments/schema";
import { formatDate } from "@/utils/format-date";
import { formatFileSize, MAX_UPLOAD_BYTES } from "@/utils/format-file-size";
import { IMAGE_MIME_TYPES, isImageMimeType } from "./attachment-list";

const MAX_FILES = 10;

interface ImageGalleryProps {
	orgId: string;
	entityType: EntityType;
	entityId: number;
}

export function ImageGallery({
	orgId,
	entityType,
	entityId,
}: ImageGalleryProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectedImage, setSelectedImage] = useState<AttachmentResponse | null>(
		null,
	);
	const [uploadCount, setUploadCount] = useState(0);

	const uploadMutation = useUploadMutation();
	const createMutation = useCreateAttachmentMutation(orgId);
	const deleteMutation = useDeleteAttachmentMutation(
		orgId,
		entityType,
		entityId,
	);

	const { data: attachments = [], isLoading } = useQuery(
		attachmentsQueryOptions(orgId, entityType, entityId),
	);

	const images = useMemo(
		() => attachments.filter((a) => isImageMimeType(a.mime_type)),
		[attachments],
	);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const fileArray = Array.from(files);

		if (fileArray.length > MAX_FILES) {
			alert(m.shared_alert_max_files({ count: MAX_FILES }));
			return;
		}

		const invalidTypeFiles = fileArray.filter(
			(f) => !IMAGE_MIME_TYPES.includes(f.type),
		);
		if (invalidTypeFiles.length > 0) {
			alert(m.shared_alert_file_type_images());
			return;
		}

		const oversizedFiles = fileArray.filter((f) => f.size > MAX_UPLOAD_BYTES);
		if (oversizedFiles.length > 0) {
			alert(
				m.shared_alert_file_size({ size: formatFileSize(MAX_UPLOAD_BYTES) }),
			);
			return;
		}

		setUploadCount(fileArray.length);

		try {
			for (const file of fileArray) {
				const uploadResult = await uploadMutation.mutateAsync({
					organizationId: orgId,
					file,
					folder: `attachments/${entityType}s`,
				});

				await createMutation.mutateAsync({
					entity_type: entityType,
					entity_id: entityId,
					file_url: uploadResult.url,
					file_name: file.name,
					file_size: file.size,
					mime_type: file.type,
				});
			}
		} catch {
		} finally {
			setUploadCount(0);
		}

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleDelete = async (e: React.MouseEvent, attachmentId: number) => {
		e.stopPropagation();
		if (!confirm(m.shared_confirm_delete_image())) return;
		await deleteMutation.mutateAsync(attachmentId);
	};

	const isUploading =
		uploadMutation.isPending || createMutation.isPending || uploadCount > 0;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-muted-foreground">
					{m.shared_gallery()}
				</span>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept={IMAGE_MIME_TYPES.join(",")}
					className="hidden"
					onChange={handleFileChange}
				/>
				<Button
					variant="ghost"
					size="sm"
					className="h-7 gap-1.5 text-xs"
					onClick={() => fileInputRef.current?.click()}
					disabled={isUploading}
				>
					<UploadIcon className="size-3.5" />
					{isUploading
						? uploadCount > 1
							? m.shared_uploading_count({ count: uploadCount })
							: m.shared_uploading()
						: m.shared_upload()}
				</Button>
			</div>

			{isLoading ? (
				<div className="text-sm text-muted-foreground">
					{m.shared_loading()}
				</div>
			) : images.length === 0 ? (
				<div className="text-sm text-muted-foreground/60">
					{m.shared_no_images()}
				</div>
			) : (
				<div className="space-y-2">
					{images.map((image) => (
						<Item
							key={image.id}
							variant="outline"
							className="cursor-pointer"
							onClick={() => setSelectedImage(image)}
						>
							<ItemMedia variant="image">
								{image.file_url ? (
									<img src={image.file_url} alt={image.file_name} />
								) : (
									<ImageIcon className="w-5 h-5 text-muted-foreground" />
								)}
							</ItemMedia>
							<ItemContent>
								<ItemTitle>{image.file_name}</ItemTitle>
								{(image.file_size || image.created_at) && (
									<ItemDescription>
										{image.file_size ? formatFileSize(image.file_size) : null}
										{image.file_size && image.created_at ? " · " : null}
										{image.created_at ? formatDate(image.created_at) : null}
									</ItemDescription>
								)}
							</ItemContent>
							<ItemActions>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									render={
										<a href={image.file_url} download={image.file_name} />
									}
								>
									<DownloadSimpleIcon className="w-4 h-4" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={(e) => handleDelete(e, image.id)}
									disabled={deleteMutation.isPending}
								>
									<XIcon className="w-4 h-4" />
								</Button>
							</ItemActions>
						</Item>
					))}
				</div>
			)}

			<Dialog
				open={!!selectedImage}
				onOpenChange={(open) => !open && setSelectedImage(null)}
			>
				<DialogContent className="sm:max-w-2xl p-1">
					{selectedImage && (
						<img
							src={selectedImage.file_url}
							alt={selectedImage.file_name}
							className="h-auto max-h-[80vh] w-full object-contain"
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
