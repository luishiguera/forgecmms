import { CalendarIcon } from "@phosphor-icons/react/dist/csr/Calendar";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/csr/CalendarDots";
import { CameraIcon } from "@phosphor-icons/react/dist/csr/Camera";
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { CheckSquareIcon } from "@phosphor-icons/react/dist/csr/CheckSquare";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/csr/DotsSixVertical";
import { EnvelopeIcon } from "@phosphor-icons/react/dist/csr/Envelope";
import { FileIcon } from "@phosphor-icons/react/dist/csr/File";
import { HashIcon } from "@phosphor-icons/react/dist/csr/Hash";
import { HeartIcon } from "@phosphor-icons/react/dist/csr/Heart";
import { LinkIcon } from "@phosphor-icons/react/dist/csr/Link";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { ParagraphIcon } from "@phosphor-icons/react/dist/csr/Paragraph";
import { PencilLineIcon } from "@phosphor-icons/react/dist/csr/PencilLine";
import { PhoneIcon } from "@phosphor-icons/react/dist/csr/Phone";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { RadioButtonIcon } from "@phosphor-icons/react/dist/csr/RadioButton";
import { SlidersIcon } from "@phosphor-icons/react/dist/csr/Sliders";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { TableIcon } from "@phosphor-icons/react/dist/csr/Table";
import { TextAaIcon } from "@phosphor-icons/react/dist/csr/TextAa";
import { ThumbsUpIcon } from "@phosphor-icons/react/dist/csr/ThumbsUp";
import { ToggleLeftIcon } from "@phosphor-icons/react/dist/csr/ToggleLeft";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
	FIELD_TYPES,
	type FieldType,
	type RatingConfig,
	type ValidationRule,
} from "../utils/types";

export interface FieldBlockProps {
	id: string;
	fieldType: FieldType;
	label: string;
	placeholder?: string;
	helpText?: string;
	options?: string[];
	validation?: ValidationRule[];
	ratingConfig?: RatingConfig;
	isSelected: boolean;
	onSelect: () => void;
	onLabelChange: (label: string) => void;
	onDelete: () => void;
	onInsertBelow: (type: FieldType) => void;
	dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const fieldTypeIcons: Record<
	FieldType,
	React.ComponentType<{
		className?: string;
		weight?: "duotone" | "regular" | "bold";
	}>
> = {
	short_text: TextAaIcon,
	long_text: ParagraphIcon,
	email: EnvelopeIcon,
	phone: PhoneIcon,
	link: LinkIcon,
	multiple_choice: RadioButtonIcon,
	checkboxes: CheckSquareIcon,
	multi_select: ListChecksIcon,
	number: HashIcon,
	linear_scale: SlidersIcon,
	rating: StarIcon,
	date: CalendarIcon,
	datetime: CalendarDotsIcon,
	matrix: TableIcon,
	signature: PencilLineIcon,
	photo: CameraIcon,
	file: FileIcon,
	toggle: ToggleLeftIcon,
};

const fieldTypeLabels: Record<FieldType, string> = {
	short_text: "Short Text",
	long_text: "Long Text",
	email: "Email",
	phone: "Phone",
	link: "Link",
	multiple_choice: "Multiple Choice",
	checkboxes: "Checkboxes",
	multi_select: "Multi-Select",
	number: "Number",
	linear_scale: "Linear Scale",
	rating: "Rating",
	date: "Date",
	datetime: "Date & Time",
	matrix: "Matrix",
	signature: "Signature",
	photo: "Photo",
	file: "File",
	toggle: "Toggle",
};

export function FieldBlock({
	id,
	fieldType,
	label,
	placeholder,
	helpText,
	options = [],
	validation = [],
	ratingConfig,
	isSelected,
	onSelect,
	onLabelChange,
	onDelete,
	onInsertBelow,
	dragHandleProps,
}: FieldBlockProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedLabel, setEditedLabel] = useState(label);
	const inputRef = useRef<HTMLInputElement>(null);
	const blockRef = useRef<HTMLDivElement>(null);

	const Icon = fieldTypeIcons[fieldType] ?? TextAaIcon;
	const isRequired = validation.some((v) => v.type === "required");

	useEffect(() => {
		if (isSelected && blockRef.current) {
			blockRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
	}, [isSelected]);

	const handleLabelDoubleClick = useCallback(() => {
		setIsEditing(true);
		setEditedLabel(label);
		setTimeout(() => inputRef.current?.focus(), 0);
	}, [label]);

	const handleLabelBlur = useCallback(() => {
		setIsEditing(false);
		if (editedLabel.trim() && editedLabel !== label) {
			onLabelChange(editedLabel.trim());
		} else {
			setEditedLabel(label);
		}
	}, [editedLabel, label, onLabelChange]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleLabelBlur();
			}
			if (e.key === "Escape") {
				setEditedLabel(label);
				setIsEditing(false);
			}
		},
		[handleLabelBlur, label],
	);

	return (
		<div ref={blockRef} className="group relative" data-field-id={id}>
			<div
				className={cn(
					"rounded-lg border bg-card p-4 transition-all cursor-pointer",
					isSelected
						? "border-primary ring-2 ring-primary/20"
						: "border-border hover:border-muted-foreground/30",
				)}
				onClick={onSelect}
			>
				<div className="flex items-center gap-2 mb-3">
					<Icon
						className="size-4 text-muted-foreground shrink-0"
						weight="duotone"
					/>
					{isEditing ? (
						<input
							ref={inputRef}
							type="text"
							value={editedLabel}
							onChange={(e) => setEditedLabel(e.target.value)}
							onBlur={handleLabelBlur}
							onKeyDown={handleKeyDown}
							className="flex-1 bg-transparent border-none outline-none text-sm font-medium focus:ring-0 p-0"
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<span
							className="flex-1 text-sm font-medium cursor-text"
							onDoubleClick={handleLabelDoubleClick}
						>
							{label}
							{isRequired && <span className="text-destructive ml-1">*</span>}
						</span>
					)}

					<Badge
						variant="secondary"
						className="text-[10px] h-5 px-1.5 shrink-0 ml-auto opacity-60"
					>
						{fieldTypeLabels[fieldType] ?? fieldType}
					</Badge>

					<div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
						<DropdownMenu>
							<DropdownMenuTrigger
								className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
								onClick={(e) => e.stopPropagation()}
							>
								<PlusIcon className="size-3.5" weight="bold" />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-48 max-h-80 overflow-y-auto"
							>
								{FIELD_TYPES.map((fieldTypeConfig) => {
									const TypeIcon = fieldTypeIcons[fieldTypeConfig.type];
									return (
										<DropdownMenuItem
											key={fieldTypeConfig.type}
											className="gap-2 cursor-pointer"
											onClick={(e) => {
												e.stopPropagation();
												onInsertBelow(fieldTypeConfig.type);
											}}
										>
											<TypeIcon className="size-4" weight="duotone" />
											{fieldTypeConfig.label}
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuContent>
						</DropdownMenu>

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
				</div>

				{helpText && (
					<p className="mb-3 text-xs text-muted-foreground">{helpText}</p>
				)}

				<FieldPreview
					fieldType={fieldType}
					placeholder={placeholder}
					options={options}
					ratingConfig={ratingConfig}
				/>
			</div>
		</div>
	);
}

interface FieldPreviewProps {
	fieldType: FieldType;
	placeholder?: string;
	options?: string[];
	ratingConfig?: RatingConfig;
}

const ratingIcons = {
	star: StarIcon,
	heart: HeartIcon,
	thumb: ThumbsUpIcon,
};

function FieldPreview({
	fieldType,
	placeholder,
	options = [],
	ratingConfig,
}: FieldPreviewProps) {
	switch (fieldType) {
		case "short_text":
			return (
				<div className="pointer-events-none">
					<Input
						placeholder={placeholder || "Enter text..."}
						className="h-9 bg-muted/50 border-muted-foreground/30"
						disabled
					/>
				</div>
			);

		case "long_text":
			return (
				<div className="pointer-events-none">
					<Textarea
						placeholder={placeholder || "Enter long text..."}
						className="min-h-20 bg-muted/50 border-muted-foreground/30 resize-none"
						disabled
					/>
				</div>
			);

		case "email":
			return (
				<div className="pointer-events-none">
					<Input
						type="email"
						placeholder={placeholder || "email@example.com"}
						className="h-9 bg-muted/50 border-muted-foreground/30"
						disabled
					/>
				</div>
			);

		case "phone":
			return (
				<div className="pointer-events-none">
					<Input
						type="tel"
						placeholder={placeholder || "+1 (555) 000-0000"}
						className="h-9 bg-muted/50 border-muted-foreground/30"
						disabled
					/>
				</div>
			);

		case "link":
			return (
				<div className="pointer-events-none">
					<Input
						type="url"
						placeholder={placeholder || "https://example.com"}
						className="h-9 bg-muted/50 border-muted-foreground/30"
						disabled
					/>
				</div>
			);

		case "multiple_choice":
			return (
				<div className="space-y-2 pointer-events-none">
					{(options.length > 0
						? options.slice(0, 3)
						: ["Option 1", "Option 2", "Option 3"]
					).map((opt, i) => (
						<div key={i} className="flex items-center gap-2">
							<div className="w-4 h-4 rounded-full border-2 border-muted-foreground/60" />
							<span className="text-sm text-muted-foreground">{opt}</span>
						</div>
					))}
					{options.length > 3 && (
						<span className="text-xs text-muted-foreground">
							+{options.length - 3} more
						</span>
					)}
				</div>
			);

		case "checkboxes":
			return (
				<div className="space-y-2 pointer-events-none">
					{(options.length > 0
						? options.slice(0, 3)
						: ["Option 1", "Option 2", "Option 3"]
					).map((opt, i) => (
						<div key={i} className="flex items-center gap-2">
							<Checkbox disabled />
							<span className="text-sm text-muted-foreground">{opt}</span>
						</div>
					))}
					{options.length > 3 && (
						<span className="text-xs text-muted-foreground">
							+{options.length - 3} more
						</span>
					)}
				</div>
			);

		case "multi_select":
			return (
				<div className="pointer-events-none">
					<div className="flex items-center justify-between h-9 px-3 rounded-md border border-muted-foreground/30 bg-muted/50 text-sm text-muted-foreground">
						<span>{placeholder || "Select multiple..."}</span>
						<CaretDownIcon className="size-4" />
					</div>
					{options.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1">
							{options.slice(0, 3).map((opt, i) => (
								<Badge key={i} variant="outline" className="text-[10px]">
									{opt}
								</Badge>
							))}
							{options.length > 3 && (
								<Badge variant="outline" className="text-[10px]">
									+{options.length - 3} more
								</Badge>
							)}
						</div>
					)}
				</div>
			);

		case "number":
			return (
				<div className="pointer-events-none">
					<Input
						type="number"
						placeholder={placeholder || "Enter number..."}
						className="h-9 bg-muted/50 border-muted-foreground/30"
						disabled
					/>
				</div>
			);

		case "linear_scale":
			return (
				<div className="pointer-events-none">
					<div className="flex items-center justify-between gap-2">
						<span className="text-xs text-muted-foreground">1</span>
						<div className="flex-1 flex items-center gap-1">
							{[1, 2, 3, 4, 5].map((n) => (
								<div
									key={n}
									className="flex-1 h-8 rounded border border-muted-foreground/30 bg-muted/50 flex items-center justify-center text-xs text-muted-foreground"
								>
									{n}
								</div>
							))}
						</div>
						<span className="text-xs text-muted-foreground">5</span>
					</div>
				</div>
			);

		case "rating": {
			const maxRating = ratingConfig?.max_rating || 5;
			const iconType = ratingConfig?.icon || "star";
			const RatingIcon = ratingIcons[iconType];
			return (
				<div className="flex items-center gap-1 pointer-events-none">
					{Array.from({ length: maxRating }, (_, i) => (
						<RatingIcon
							key={i}
							className="size-6 text-muted-foreground/60"
							weight="duotone"
						/>
					))}
				</div>
			);
		}

		case "date":
			return (
				<div className="pointer-events-none">
					<div className="flex items-center justify-between h-9 px-3 rounded-md border border-muted-foreground/30 bg-muted/50 text-sm text-muted-foreground">
						<span>{placeholder || "Select date..."}</span>
						<CalendarIcon className="size-4" />
					</div>
				</div>
			);

		case "datetime":
			return (
				<div className="pointer-events-none">
					<div className="flex items-center justify-between h-9 px-3 rounded-md border border-muted-foreground/30 bg-muted/50 text-sm text-muted-foreground">
						<span>{placeholder || "Select date & time..."}</span>
						<CalendarDotsIcon className="size-4" />
					</div>
				</div>
			);

		case "matrix":
			return (
				<div className="pointer-events-none overflow-x-auto">
					<table className="w-full text-xs">
						<thead>
							<tr>
								<th className="p-1" />
								<th className="p-1 text-muted-foreground font-normal">Col 1</th>
								<th className="p-1 text-muted-foreground font-normal">Col 2</th>
								<th className="p-1 text-muted-foreground font-normal">Col 3</th>
							</tr>
						</thead>
						<tbody>
							{["Row 1", "Row 2"].map((row, i) => (
								<tr key={i}>
									<td className="p-1 text-muted-foreground">{row}</td>
									<td className="p-1 text-center">
										<div className="w-4 h-4 mx-auto rounded-full border-2 border-muted-foreground/60" />
									</td>
									<td className="p-1 text-center">
										<div className="w-4 h-4 mx-auto rounded-full border-2 border-muted-foreground/60" />
									</td>
									<td className="p-1 text-center">
										<div className="w-4 h-4 mx-auto rounded-full border-2 border-muted-foreground/60" />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);

		case "signature":
			return (
				<div className="pointer-events-none">
					<div className="flex items-center justify-center h-20 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 text-sm text-muted-foreground">
						<PencilLineIcon className="size-5 mr-2" weight="duotone" />
						Tap to sign
					</div>
				</div>
			);

		case "photo":
			return (
				<div className="pointer-events-none">
					<div className="flex items-center justify-center h-20 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 text-sm text-muted-foreground">
						<CameraIcon className="size-5 mr-2" weight="duotone" />
						Tap to upload photo
					</div>
				</div>
			);

		case "file":
			return (
				<div className="pointer-events-none">
					<div className="flex items-center justify-center h-20 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 text-sm text-muted-foreground">
						<FileIcon className="size-5 mr-2" weight="duotone" />
						Tap to upload file
					</div>
				</div>
			);

		case "toggle":
			return (
				<div className="flex items-center gap-3 pointer-events-none">
					<div className="w-10 h-6 rounded-full bg-muted border border-input relative">
						<div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-muted-foreground/60" />
					</div>
					<span className="text-sm text-muted-foreground">
						{placeholder || "Toggle this option"}
					</span>
				</div>
			);

		default:
			return null;
	}
}

export default FieldBlock;
