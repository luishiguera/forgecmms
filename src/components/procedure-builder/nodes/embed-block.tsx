import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/csr/DotsSixVertical";
import { ImageIcon } from "@phosphor-icons/react/dist/csr/Image";
import { InfoIcon } from "@phosphor-icons/react/dist/csr/Info";
import { NoteIcon } from "@phosphor-icons/react/dist/csr/Note";
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/csr/SpeakerHigh";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { UploadIcon } from "@phosphor-icons/react/dist/csr/Upload";
import { VideoCameraIcon } from "@phosphor-icons/react/dist/csr/VideoCamera";
import { WarningIcon } from "@phosphor-icons/react/dist/csr/Warning";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmbedType, NoteVariant } from "../utils/types";

export interface EmbedBlockProps {
	id: string;
	label?: string;
	embedType: EmbedType;
	src?: string;
	alt?: string;
	caption?: string;
	noteVariant?: NoteVariant;
	noteContent?: string;
	isSelected: boolean;
	onSelect: () => void;
	onUpdate: (updates: {
		label?: string;
		src?: string;
		alt?: string;
		caption?: string;
		noteVariant?: NoteVariant;
		noteContent?: string;
	}) => void;
	onDelete: () => void;
	dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const embedTypeIcons: Record<
	EmbedType,
	React.ComponentType<{
		className?: string;
		weight?: "duotone" | "regular" | "bold";
	}>
> = {
	image: ImageIcon,
	video: VideoCameraIcon,
	audio: SpeakerHighIcon,
	note: NoteIcon,
};

const embedTypeLabels: Record<EmbedType, string> = {
	image: "Image",
	video: "Video",
	audio: "Audio",
	note: "Note",
};

const acceptedFileTypes: Record<EmbedType, string> = {
	image: "image/jpeg,image/png,image/webp,image/gif",
	video: "video/mp4,video/webm,video/ogg",
	audio: "audio/mpeg,audio/wav,audio/ogg,audio/mp3",
	note: "",
};

const noteVariantConfig: Record<
	NoteVariant,
	{
		icon: React.ComponentType<{
			className?: string;
			weight?: "duotone" | "regular" | "bold";
		}>;
		label: string;
		bgClass: string;
		borderClass: string;
		iconClass: string;
	}
> = {
	info: {
		icon: InfoIcon,
		label: "Info",
		bgClass: "bg-blue-50 dark:bg-blue-950/30",
		borderClass: "border-blue-200 dark:border-blue-800",
		iconClass: "text-blue-500",
	},
	warning: {
		icon: WarningIcon,
		label: "Warning",
		bgClass: "bg-amber-50 dark:bg-amber-950/30",
		borderClass: "border-amber-200 dark:border-amber-800",
		iconClass: "text-amber-500",
	},
	success: {
		icon: CheckCircleIcon,
		label: "Success",
		bgClass: "bg-green-50 dark:bg-green-950/30",
		borderClass: "border-green-200 dark:border-green-800",
		iconClass: "text-green-500",
	},
	error: {
		icon: WarningCircleIcon,
		label: "Error",
		bgClass: "bg-red-50 dark:bg-red-950/30",
		borderClass: "border-red-200 dark:border-red-800",
		iconClass: "text-red-500",
	},
};

export function EmbedBlock({
	id: _id,
	label: propLabel,
	embedType,
	src,
	alt,
	caption,
	noteVariant = "info",
	noteContent = "",
	isSelected,
	onSelect,
	onUpdate,
	onDelete,
	dragHandleProps,
}: EmbedBlockProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const blockRef = useRef<HTMLDivElement>(null);

	const Icon = embedTypeIcons[embedType];
	const label = propLabel || embedTypeLabels[embedType];

	useEffect(() => {
		if (isSelected && blockRef.current) {
			blockRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
	}, [isSelected]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const objectUrl = URL.createObjectURL(file);
			onUpdate({ src: objectUrl });
		}
	};

	const handleRemove = () => {
		onUpdate({ src: undefined });
	};

	const actionButtons = (
		<div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
			<div
				className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
				{...dragHandleProps}
			>
				<DotsSixVerticalIcon className="size-3.5" weight="bold" />
			</div>

			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onDelete();
				}}
				className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
			>
				<TrashIcon className="size-3.5" weight="bold" />
			</button>
		</div>
	);

	return (
		<div ref={blockRef} className="group relative" onClick={onSelect}>
			{embedType === "note" ? (
				<NoteEditor
					variant={noteVariant}
					content={noteContent}
					isSelected={isSelected}
					onVariantChange={(v) => onUpdate({ noteVariant: v })}
					onContentChange={(c) => onUpdate({ noteContent: c })}
					actions={actionButtons}
				/>
			) : (
				<div
					className={cn(
						"rounded-lg border p-3 transition-all cursor-pointer",
						isSelected
							? "border-primary bg-primary/5 ring-2 ring-primary/20"
							: "border-border hover:border-muted-foreground/30 bg-card",
					)}
				>
					<div className="flex items-center gap-2 mb-3">
						<div className="p-1.5 rounded bg-muted">
							<Icon className="size-4 text-muted-foreground" weight="duotone" />
						</div>
						<span className="text-sm font-medium">{label}</span>
						{actionButtons}
					</div>

					{src ? (
						<EmbedPreview
							embedType={embedType}
							src={src}
							alt={alt}
							caption={caption}
							onRemove={handleRemove}
							onCaptionChange={(newCaption) =>
								onUpdate({ caption: newCaption })
							}
							onAltChange={(newAlt) => onUpdate({ alt: newAlt })}
						/>
					) : (
						<EmbedUpload
							embedType={embedType}
							fileInputRef={fileInputRef}
							acceptedTypes={acceptedFileTypes[embedType]}
							onFileChange={handleFileChange}
						/>
					)}
				</div>
			)}
		</div>
	);
}

interface EmbedPreviewProps {
	embedType: EmbedType;
	src: string;
	alt?: string;
	caption?: string;
	onRemove: () => void;
	onCaptionChange: (caption: string) => void;
	onAltChange: (alt: string) => void;
}

function EmbedPreview({
	embedType,
	src,
	alt,
	caption,
	onRemove,
	onCaptionChange,
	onAltChange,
}: EmbedPreviewProps) {
	const [showSettings, setShowSettings] = useState(false);

	return (
		<div className="space-y-2">
			<div className="relative group/media">
				{embedType === "image" && (
					<img
						src={src}
						alt={alt || "Embedded image"}
						className="max-w-full h-auto rounded-md border border-border"
					/>
				)}

				{embedType === "video" && (
					<video
						src={src}
						controls
						className="max-w-full h-auto rounded-md border border-border"
					>
						<track kind="captions" />
						Your browser does not support the video tag.
					</video>
				)}

				{embedType === "audio" && (
					<audio src={src} controls className="w-full">
						Your browser does not support the audio tag.
					</audio>
				)}

				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer opacity-0 group-hover/media:opacity-100 transition-opacity"
					title="Remove"
				>
					<XIcon className="size-4" weight="bold" />
				</button>
			</div>

			<Input
				value={caption || ""}
				onChange={(e) => onCaptionChange(e.target.value)}
				placeholder="Add a caption (optional)..."
				className="text-sm"
				onClick={(e) => e.stopPropagation()}
			/>

			{embedType === "image" && (
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setShowSettings(!showSettings);
						}}
						className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
					>
						{showSettings ? "Hide" : "Show"} alt text
					</button>
				</div>
			)}

			{embedType === "image" && showSettings && (
				<Input
					value={alt || ""}
					onChange={(e) => onAltChange(e.target.value)}
					placeholder="Describe this image for accessibility..."
					className="text-sm"
					onClick={(e) => e.stopPropagation()}
				/>
			)}
		</div>
	);
}

interface EmbedUploadProps {
	embedType: EmbedType;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	acceptedTypes: string;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function EmbedUpload({
	embedType,
	fileInputRef,
	acceptedTypes,
	onFileChange,
}: EmbedUploadProps) {
	return (
		<div onClick={(e) => e.stopPropagation()}>
			<div
				className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-lg hover:border-muted-foreground/50 transition-colors cursor-pointer"
				onClick={() => fileInputRef.current?.click()}
			>
				<UploadIcon
					className="size-8 text-muted-foreground mb-2"
					weight="duotone"
				/>
				<p className="text-sm text-muted-foreground">
					Click to upload {embedType}
				</p>
				<p className="text-xs text-muted-foreground/70 mt-1">
					{embedType === "image" && "JPEG, PNG, WebP, GIF"}
					{embedType === "video" && "MP4, WebM, OGG"}
					{embedType === "audio" && "MP3, WAV, OGG"}
				</p>
			</div>
			<input
				ref={fileInputRef}
				type="file"
				accept={acceptedTypes}
				onChange={onFileChange}
				className="hidden"
			/>
		</div>
	);
}

interface NoteEditorProps {
	variant: NoteVariant;
	content: string;
	isSelected: boolean;
	onVariantChange: (variant: NoteVariant) => void;
	onContentChange: (content: string) => void;
	actions?: React.ReactNode;
}

function NoteEditor({
	variant,
	content,
	isSelected,
	onVariantChange,
	onContentChange,
	actions,
}: NoteEditorProps) {
	const config = noteVariantConfig[variant];
	const variants: NoteVariant[] = ["info", "warning", "success", "error"];

	return (
		<div
			className={cn(
				"flex-1 rounded-lg border p-3 transition-all cursor-pointer",
				config.bgClass,
				isSelected
					? "ring-2 ring-primary/20 border-primary"
					: cn(config.borderClass, "hover:border-muted-foreground/30"),
			)}
			onClick={(e) => e.stopPropagation()}
		>
			<div className="flex items-center gap-2 mb-3">
				<div className="flex gap-1">
					{variants.map((v) => {
						const vConfig = noteVariantConfig[v];
						const VIcon = vConfig.icon;
						return (
							<button
								key={v}
								type="button"
								onClick={() => onVariantChange(v)}
								className={cn(
									"p-1.5 rounded-md cursor-pointer transition-all",
									variant === v
										? cn(vConfig.bgClass, vConfig.borderClass, "border")
										: "hover:bg-muted",
								)}
								title={vConfig.label}
							>
								<VIcon
									className={cn(
										"size-4",
										variant === v ? vConfig.iconClass : "text-muted-foreground",
									)}
									weight="duotone"
								/>
							</button>
						);
					})}
				</div>
				{actions}
			</div>

			<Textarea
				value={content}
				onChange={(e) => onContentChange(e.target.value)}
				placeholder="Write your note here..."
				className={cn(
					"min-h-15 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm",
				)}
			/>
		</div>
	);
}

export default EmbedBlock;
