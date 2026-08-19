import { CameraIcon } from "@phosphor-icons/react/dist/csr/Camera";
import { FileIcon } from "@phosphor-icons/react/dist/csr/File";
import { UploadIcon } from "@phosphor-icons/react/dist/csr/Upload";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { type ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUploadMutation } from "@/lib/queries/upload";
import * as m from "@/paraglide/messages";
import {
	formatMegabytes,
	MAX_UPLOAD_BYTES,
	MAX_UPLOAD_MB,
} from "@/utils/format-file-size";
import { compressImage } from "@/utils/image";

export const filenameFromUrl = (url: string) => {
	const last = url.split("?")[0].split("/").pop();
	if (!last) return url;
	try {
		return decodeURIComponent(last);
	} catch {
		return last;
	}
};

const isAccepted = (file: File, acceptedTypes: string[]) => {
	if (acceptedTypes.length === 0) return true;
	return acceptedTypes.some((accepted) =>
		accepted.endsWith("/*")
			? file.type.startsWith(accepted.slice(0, -1))
			: file.type === accepted || file.name.toLowerCase().endsWith(accepted),
	);
};

export function MediaInput({
	orgId,
	kind,
	value,
	onChange,
	multiple,
	maxFiles,
	acceptedTypes = [],
	disabled,
}: {
	orgId: string;
	kind: "photo" | "file";
	value: string[];
	onChange: (value: string[]) => void;
	multiple: boolean;
	maxFiles: number;
	acceptedTypes?: string[];
	disabled?: boolean;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState<string | undefined>();
	const upload = useUploadMutation();

	const isPhoto = kind === "photo";
	const remaining = maxFiles - value.length;
	const accept = acceptedTypes.length
		? acceptedTypes.join(",")
		: isPhoto
			? "image/*"
			: undefined;

	const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
		const picked = Array.from(event.target.files ?? []);
		event.target.value = "";
		if (picked.length === 0) return;

		setError(undefined);
		const uploaded: string[] = [];

		for (const file of picked.slice(0, Math.max(remaining, 0))) {
			if (!isAccepted(file, acceptedTypes)) {
				setError(m.proc_media_error_type());
				continue;
			}

			const prepared = isPhoto ? await compressImage(file) : file;
			if (prepared.size > MAX_UPLOAD_BYTES) {
				setError(
					m.proc_media_error_size({ size: formatMegabytes(MAX_UPLOAD_MB) }),
				);
				continue;
			}

			try {
				const result = await upload.mutateAsync({
					organizationId: orgId,
					file: prepared,
					folder: isPhoto ? "procedure-photos" : "procedure-files",
				});
				uploaded.push(result.url);
			} catch {
				setError(m.proc_media_error_upload());
			}
		}

		if (uploaded.length > 0) onChange([...value, ...uploaded]);
	};

	const remove = (url: string) =>
		onChange(value.filter((item) => item !== url));

	return (
		<div className="flex flex-col gap-3">
			{value.length > 0 &&
				(isPhoto ? (
					<div className="flex flex-wrap gap-2">
						{value.map((url) => (
							<div key={url} className="relative">
								<img
									src={url}
									alt={filenameFromUrl(url)}
									className="size-20 rounded-lg object-cover ring-1 ring-border"
								/>
								{!disabled && (
									<button
										type="button"
										onClick={() => remove(url)}
										aria-label={m.proc_media_remove()}
										className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 ring-1 ring-border"
									>
										<XIcon className="size-3.5" />
									</button>
								)}
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col gap-1.5">
						{value.map((url) => (
							<div
								key={url}
								className="flex w-fit items-center gap-2 rounded-md bg-card px-2.5 py-1.5 text-xs ring-1 ring-border"
							>
								<FileIcon className="size-3.5 text-muted-foreground" />
								<a href={url} target="_blank" rel="noreferrer">
									{filenameFromUrl(url)}
								</a>
								{!disabled && (
									<button
										type="button"
										onClick={() => remove(url)}
										aria-label={m.proc_media_remove()}
									>
										<XIcon className="size-3.5 text-muted-foreground" />
									</button>
								)}
							</div>
						))}
					</div>
				))}

			{!disabled && remaining > 0 && (
				<div className="flex items-center gap-2">
					<input
						ref={inputRef}
						type="file"
						hidden
						accept={accept}
						capture={isPhoto ? "environment" : undefined}
						multiple={multiple && remaining > 1}
						onChange={handleFiles}
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={upload.isPending}
						onClick={() => inputRef.current?.click()}
					>
						{upload.isPending ? (
							<Spinner className="size-4" />
						) : isPhoto ? (
							<CameraIcon className="size-4" weight="duotone" />
						) : (
							<UploadIcon className="size-4" weight="duotone" />
						)}
						{isPhoto ? m.proc_media_add_photo() : m.proc_media_add_file()}
					</Button>
					<span className="text-xs text-muted-foreground">
						{m.proc_media_limits({
							count: remaining,
							size: formatMegabytes(MAX_UPLOAD_MB),
						})}
					</span>
				</div>
			)}

			{error && <span className="text-xs text-destructive">{error}</span>}
		</div>
	);
}
