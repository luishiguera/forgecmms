import slugify from "slugify";
import {
	type EmbedConfig,
	type EmbedType,
	type FieldType,
	type FormFieldConfig,
	isEmbedBlock,
	isFieldBlock,
	type ProcedureBlock,
} from "@/server/domains/procedures/schema";

export type {
	ConditionalRule,
	EmbedConfig,
	EmbedType,
	FieldType,
	FileConfig,
	FormFieldConfig,
	MatrixConfig,
	NoteVariant,
	PhotoConfig,
	ProcedureBlock,
	RatingConfig,
	ScaleConfig,
	TextConfig,
	ValidationRule,
} from "@/server/domains/procedures/schema";

export type EditorBlock =
	| { nodeType: "field"; id: string; data: FormFieldConfig }
	| { nodeType: "embed"; id: string; data: EmbedConfig };

export function toProcedureBlocks(blocks: EditorBlock[]): ProcedureBlock[] {
	return blocks.map((block, order) =>
		block.nodeType === "field"
			? { ...block.data, nodeType: "field" as const, order }
			: { ...block.data, nodeType: "embed" as const, order },
	);
}

export function splitProcedureBlocks(blocks: ProcedureBlock[]): {
	fields: FormFieldConfig[];
	embeds: EmbedConfig[];
} {
	return {
		fields: blocks.filter(isFieldBlock),
		embeds: blocks.filter(isEmbedBlock),
	};
}

export interface BlockItem {
	type: FieldType | EmbedType;
	label: string;
	icon: string;
	description: string;
	category: "field" | "embed";
}

export interface ProcedureBuilderData {
	id?: number;
	name: string;
	description: string;
	fields: FormFieldConfig[];
	embeds?: EmbedConfig[];
	status: "draft" | "active" | "archived";
}

export interface FieldTypeConfig {
	type: FieldType;
	label: string;
	icon: string;
	description: string;
}

export interface EmbedTypeConfig {
	type: EmbedType;
	label: string;
	icon: string;
	description: string;
}

export const FIELD_TYPES: FieldTypeConfig[] = [
	{
		type: "short_text",
		label: "Short Text",
		icon: "TextAa",
		description: "Single line text",
	},
	{
		type: "long_text",
		label: "Long Text",
		icon: "Paragraph",
		description: "Multi-line text",
	},
	{
		type: "email",
		label: "Email",
		icon: "Envelope",
		description: "Email address",
	},
	{ type: "phone", label: "Phone", icon: "Phone", description: "Phone number" },
	{ type: "link", label: "Link", icon: "Link", description: "URL/Website" },

	{
		type: "multiple_choice",
		label: "Multiple Choice",
		icon: "RadioButton",
		description: "Single selection",
	},
	{
		type: "checkboxes",
		label: "Checkboxes",
		icon: "CheckSquare",
		description: "Multiple selections",
	},
	{
		type: "multi_select",
		label: "Multi-Select",
		icon: "ListChecks",
		description: "Dropdown multi-select",
	},

	{
		type: "number",
		label: "Number",
		icon: "Hash",
		description: "Numeric input",
	},
	{
		type: "linear_scale",
		label: "Linear Scale",
		icon: "Sliders",
		description: "Scale rating (1-5, 1-10)",
	},
	{ type: "rating", label: "Rating", icon: "Star", description: "Star rating" },

	{ type: "date", label: "Date", icon: "Calendar", description: "Date picker" },
	{
		type: "datetime",
		label: "Date & Time",
		icon: "CalendarDots",
		description: "Date and time picker",
	},

	{
		type: "matrix",
		label: "Matrix",
		icon: "Table",
		description: "Grid of questions",
	},

	{
		type: "signature",
		label: "Signature",
		icon: "PencilLine",
		description: "Signature pad",
	},
	{
		type: "photo",
		label: "Photo",
		icon: "Camera",
		description: "Photo upload",
	},
	{
		type: "file",
		label: "File",
		icon: "File",
		description: "File upload",
	},

	{
		type: "toggle",
		label: "Toggle",
		icon: "ToggleLeft",
		description: "On/off switch",
	},
];

export const EMBED_TYPES: EmbedTypeConfig[] = [
	{ type: "image", label: "Image", icon: "Image", description: "Static image" },
	{
		type: "video",
		label: "Video",
		icon: "VideoCamera",
		description: "Video embed",
	},
	{
		type: "audio",
		label: "Audio",
		icon: "SpeakerHigh",
		description: "Audio embed",
	},
	{
		type: "note",
		label: "Note",
		icon: "Note",
		description: "Callout / alert block",
	},
];

export function generateFieldId(
	label: string,
	existingFields: FormFieldConfig[],
): string {
	const baseSlug = slugify(label, { lower: true, strict: true }) || "field";
	const existingIds = new Set(existingFields.map((f) => f.id));

	if (!existingIds.has(baseSlug)) return baseSlug;

	let counter = 2;
	while (existingIds.has(`${baseSlug}-${counter}`)) counter++;
	return `${baseSlug}-${counter}`;
}

export function createDefaultField(
	type: FieldType,
	existingFields: FormFieldConfig[] = [],
): FormFieldConfig {
	const label = getDefaultLabel(type);
	const baseField: FormFieldConfig = {
		id: generateFieldId(label, existingFields),
		type,
		label,
		order: existingFields.length,
		validation: [],
	};

	switch (type) {
		case "short_text":
		case "email":
		case "phone":
		case "link":
			baseField.placeholder = "";
			break;

		case "long_text":
			baseField.placeholder = "";
			baseField.text_config = {
				min_rows: 3,
				max_rows: 10,
			};
			break;

		case "multiple_choice":
		case "checkboxes":
		case "multi_select":
			baseField.options = ["Option 1", "Option 2", "Option 3"];
			break;

		case "number":
			baseField.placeholder = "";
			break;

		case "linear_scale":
			baseField.scale_config = {
				min: 1,
				max: 5,
				min_label: "",
				max_label: "",
			};
			break;

		case "rating":
			baseField.rating_config = {
				max_rating: 5,
				icon: "star",
			};
			break;

		case "matrix":
			baseField.matrix_config = {
				rows: ["Row 1", "Row 2", "Row 3"],
				columns: ["Column 1", "Column 2", "Column 3"],
				allow_multiple: false,
			};
			break;

		case "photo":
			baseField.photo_config = {
				multiple: false,
				max_files: 1,
				accepted_types: [
					"image/jpeg",
					"image/png",
					"image/webp",
					"image/gif",
					"image/svg+xml",
					"image/heic",
					"image/heif",
					"image/bmp",
				],
			};
			break;

		case "file":
			baseField.file_config = {
				multiple: false,
				max_files: 1,
				accepted_types: [],
			};
			break;
	}

	return baseField;
}

function getDefaultLabel(type: FieldType): string {
	const labels: Record<FieldType, string> = {
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
	return labels[type];
}

export function generateEmbedId(): string {
	return `embed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const defaultEmbedLabels: Record<EmbedType, string> = {
	image: "Image",
	video: "Video",
	audio: "Audio",
	note: "Note",
};

export function createDefaultEmbed(type: EmbedType): EmbedConfig {
	const base: EmbedConfig = {
		id: generateEmbedId(),
		label: defaultEmbedLabels[type],
		type,
		src: "",
		alt: "",
		caption: "",
	};

	if (type === "note") {
		base.noteVariant = "info";
		base.noteContent = "";
	}

	return base;
}

export const ALL_BLOCK_ITEMS: BlockItem[] = [
	...FIELD_TYPES.map((f) => ({ ...f, category: "field" as const })),
	...EMBED_TYPES.map((e) => ({ ...e, category: "embed" as const })),
];
