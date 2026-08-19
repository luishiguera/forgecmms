import { DownloadSimple as DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FileIcon } from "@phosphor-icons/react/dist/csr/File";
import { FileCsvIcon } from "@phosphor-icons/react/dist/csr/FileCsv";
import { FileDocIcon } from "@phosphor-icons/react/dist/csr/FileDoc";
import { FilePdfIcon } from "@phosphor-icons/react/dist/csr/FilePdf";
import { FileXlsIcon } from "@phosphor-icons/react/dist/csr/FileXls";
import { ImageIcon } from "@phosphor-icons/react/dist/csr/Image";
import { UploadIcon } from "@phosphor-icons/react/dist/csr/Upload";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { formatDate } from "@/utils/format-date";
import { formatFileSize, MAX_UPLOAD_BYTES } from "@/utils/format-file-size";

export const IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
];

export const DOCUMENT_MIME_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"text/plain",
	"text/csv",
];

export function isImageMimeType(mimeType: string | null | undefined): boolean {
	return mimeType ? IMAGE_MIME_TYPES.includes(mimeType) : false;
}

export function isDocumentMimeType(
	mimeType: string | null | undefined,
): boolean {
	return mimeType ? DOCUMENT_MIME_TYPES.includes(mimeType) : false;
}

type AttachmentFilter = "all" | "images" | "documents";

interface AttachmentListProps {
	orgId: string;
	entityType: EntityType;
	entityId: number;
	filter?: AttachmentFilter;
	hideHeader?: boolean;
	allowedTypes?: string[];
	title?: string;
}

const ALLOWED_TYPES = [...DOCUMENT_MIME_TYPES, ...IMAGE_MIME_TYPES];
const MAX_FILES = 10;

function getFileIcon(mimeType: string | null | undefined) {
	if (!mimeType) return <FileIcon className="size-5" weight="duotone" />;

	if (mimeType.startsWith("image/")) {
		return <ImageIcon className="size-5" weight="duotone" />;
	}
	if (mimeType === "application/pdf") {
		return <FilePdfIcon className="size-5" weight="duotone" />;
	}
	if (
		mimeType === "application/msword" ||
		mimeType.includes("wordprocessingml")
	) {
		return <FileDocIcon className="size-5" weight="duotone" />;
	}
	if (
		mimeType === "application/vnd.ms-excel" ||
		mimeType.includes("spreadsheetml")
	) {
		return <FileXlsIcon className="size-5" weight="duotone" />;
	}
	if (mimeType === "text/csv") {
		return <FileCsvIcon className="size-5" weight="duotone" />;
	}

	return <FileIcon className="size-5" weight="duotone" />;
}

function getDefaultTitle(filter: AttachmentFilter): string {
	switch (filter) {
		case "images":
			return m.shared_gallery();
		case "documents":
			return m.shared_files();
		default:
			return m.shared_attachments();
	}
}

export function AttachmentList({
	orgId,
	entityType,
	entityId,
	filter = "all",
	hideHeader = false,
	allowedTypes,
	title,
}: AttachmentListProps) {
	const headerTitle = title ?? getDefaultTitle(filter);
	const fileInputRef = useRef<HTMLInputElement>(null);
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

	const filteredAttachments = useMemo(() => {
		if (filter === "images") {
			return attachments.filter((a) => isImageMimeType(a.mime_type));
		}
		if (filter === "documents") {
			return attachments.filter((a) => isDocumentMimeType(a.mime_type));
		}
		return attachments;
	}, [attachments, filter]);

	const acceptTypes = allowedTypes ?? ALLOWED_TYPES;

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const fileArray = Array.from(files);

		if (fileArray.length > MAX_FILES) {
			alert(m.shared_alert_max_files({ count: MAX_FILES }));
			return;
		}

		const invalidTypeFiles = fileArray.filter(
			(f) => !acceptTypes.includes(f.type),
		);
		if (invalidTypeFiles.length > 0) {
			alert(m.shared_alert_file_type_docs());
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

	const handleDelete = async (attachmentId: number) => {
		if (!confirm(m.shared_confirm_delete_attachment())) return;
		await deleteMutation.mutateAsync(attachmentId);
	};

	const isUploading =
		uploadMutation.isPending || createMutation.isPending || uploadCount > 0;

	return (
		<div className="space-y-3">
			{!hideHeader && (
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-muted-foreground">
						{headerTitle}
					</span>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept={acceptTypes.join(",")}
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
			)}

			{isLoading ? (
				<div className="text-sm text-muted-foreground">
					{m.shared_loading()}
				</div>
			) : filteredAttachments.length === 0 ? (
				<div className="text-sm text-muted-foreground/60">
					{m.shared_no_attachments()}
				</div>
			) : (
				<div className="space-y-2">
					{filteredAttachments.map((attachment) => (
						<Item key={attachment.id} variant="outline">
							<ItemMedia variant="image">
								{getFileIcon(attachment.mime_type)}
							</ItemMedia>
							<ItemContent>
								<ItemTitle>
									<a
										href={attachment.file_url}
										target="_blank"
										rel="noopener noreferrer"
										className="hover:underline"
									>
										{attachment.file_name}
									</a>
								</ItemTitle>
								{attachment.file_size && (
									<ItemDescription>
										{formatFileSize(attachment.file_size)}
									</ItemDescription>
								)}
							</ItemContent>
							<ItemActions className="flex-col items-center gap-0.5">
								{attachment.created_at && (
									<span className="text-xs text-muted-foreground/70 px-1 leading-none">
										{formatDate(attachment.created_at)}
									</span>
								)}
								<div className="flex items-center">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										render={
											<a
												href={attachment.file_url}
												download={attachment.file_name}
											/>
										}
									>
										<DownloadSimpleIcon className="w-4 h-4" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => handleDelete(attachment.id)}
										disabled={deleteMutation.isPending}
									>
										<XIcon className="w-4 h-4" />
									</Button>
								</div>
							</ItemActions>
						</Item>
					))}
				</div>
			)}
		</div>
	);
}
