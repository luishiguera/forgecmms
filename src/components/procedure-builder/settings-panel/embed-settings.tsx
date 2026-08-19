import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { ImageIcon } from "@phosphor-icons/react/dist/csr/Image";
import { InfoIcon } from "@phosphor-icons/react/dist/csr/Info";
import { NoteIcon } from "@phosphor-icons/react/dist/csr/Note";
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/csr/SpeakerHigh";
import { VideoCameraIcon } from "@phosphor-icons/react/dist/csr/VideoCamera";
import { WarningIcon } from "@phosphor-icons/react/dist/csr/Warning";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmbedConfig, NoteVariant } from "../utils/types";

interface EmbedSettingsProps {
	embed: EmbedConfig | null;
	onUpdate: (updates: Partial<EmbedConfig>) => void;
	onClose: () => void;
}

const embedTypeIcons: Record<
	string,
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

const embedTypeLabels: Record<string, string> = {
	image: "Image",
	video: "Video",
	audio: "Audio",
	note: "Note",
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

export function EmbedSettings({
	embed,
	onUpdate,
	onClose,
}: EmbedSettingsProps) {
	if (!embed) {
		return (
			<div className="h-full flex flex-col items-center justify-center text-center p-6">
				<GearSixIcon
					className="size-12 text-muted-foreground/30"
					weight="duotone"
				/>
				<p className="mt-4 text-sm text-muted-foreground">
					Select an embed to edit its properties
				</p>
			</div>
		);
	}

	const Icon = embedTypeIcons[embed.type] || ImageIcon;
	const typeLabel = embedTypeLabels[embed.type] || "Embed";

	return (
		<div className="h-full flex flex-col">
			<div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
				<div className="flex items-center gap-2">
					<Icon className="size-5 text-muted-foreground" weight="duotone" />
					<span className="font-medium text-sm">{typeLabel} Settings</span>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
				>
					<XIcon className="size-4" weight="bold" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				<div className="space-y-1.5">
					<Label htmlFor="embed-label" className="text-xs">
						Title
					</Label>
					<Input
						id="embed-label"
						value={embed.label || ""}
						onChange={(e) => onUpdate({ label: e.target.value })}
						placeholder={embedTypeLabels[embed.type] || "Title..."}
					/>
				</div>

				{embed.type === "note" ? (
					<NoteSettings embed={embed} onUpdate={onUpdate} />
				) : (
					<MediaSettings embed={embed} onUpdate={onUpdate} />
				)}
			</div>
		</div>
	);
}

interface NoteSettingsProps {
	embed: EmbedConfig;
	onUpdate: (updates: Partial<EmbedConfig>) => void;
}

function NoteSettings({ embed, onUpdate }: NoteSettingsProps) {
	const variants: NoteVariant[] = ["info", "warning", "success", "error"];
	const currentVariant = embed.noteVariant || "info";

	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<Label className="text-xs">Style</Label>
				<div className="grid grid-cols-2 gap-2">
					{variants.map((v) => {
						const config = noteVariantConfig[v];
						const VIcon = config.icon;
						const isSelected = currentVariant === v;
						return (
							<button
								key={v}
								type="button"
								onClick={() => onUpdate({ noteVariant: v })}
								className={cn(
									"flex items-center gap-2 p-2 rounded-md border transition-all cursor-pointer",
									isSelected
										? cn(
												config.bgClass,
												config.borderClass,
												"ring-2 ring-primary/20",
											)
										: "border-border hover:border-muted-foreground/30",
								)}
							>
								<VIcon
									className={cn(
										"size-4",
										isSelected ? config.iconClass : "text-muted-foreground",
									)}
									weight="duotone"
								/>
								<span className="text-sm">{config.label}</span>
							</button>
						);
					})}
				</div>
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="note-content" className="text-xs">
					Content
				</Label>
				<Textarea
					id="note-content"
					value={embed.noteContent || ""}
					onChange={(e) => onUpdate({ noteContent: e.target.value })}
					placeholder="Write your note here..."
					className="min-h-25 resize-none"
				/>
			</div>
		</div>
	);
}

interface MediaSettingsProps {
	embed: EmbedConfig;
	onUpdate: (updates: Partial<EmbedConfig>) => void;
}

function MediaSettings({ embed, onUpdate }: MediaSettingsProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<Label htmlFor="embed-caption" className="text-xs">
					Caption
				</Label>
				<Input
					id="embed-caption"
					value={embed.caption || ""}
					onChange={(e) => onUpdate({ caption: e.target.value })}
					placeholder="Add a caption..."
				/>
			</div>

			{embed.type === "image" && (
				<div className="space-y-1.5">
					<Label htmlFor="embed-alt" className="text-xs">
						Alt Text
					</Label>
					<Input
						id="embed-alt"
						value={embed.alt || ""}
						onChange={(e) => onUpdate({ alt: e.target.value })}
						placeholder="Describe this image for accessibility..."
					/>
					<p className="text-xs text-muted-foreground">
						Alt text helps screen readers describe images to users
					</p>
				</div>
			)}

			{embed.src && (
				<div className="space-y-1.5">
					<Label className="text-xs">Preview</Label>
					<div className="rounded-md border border-border overflow-hidden">
						{embed.type === "image" && (
							<img
								src={embed.src}
								alt={embed.alt || "Preview"}
								className="w-full h-auto max-h-40 object-cover"
							/>
						)}
						{embed.type === "video" && (
							<video
								src={embed.src}
								className="w-full h-auto max-h-40"
								controls
							>
								<track kind="captions" />
							</video>
						)}
						{embed.type === "audio" && (
							<audio src={embed.src} controls className="w-full">
								Your browser does not support the audio tag.
							</audio>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default EmbedSettings;
