import type { ElementType } from "react";
import type { FieldStatus } from "@/hooks/use-auto-save";

export interface BaseFieldProps {
	form: any;
	onFieldChange?: (name: string) => void;
	status?: FieldStatus;
}

export interface ItemDetailLink {
	href: string;
	target?: string;
	rel?: string;
}

export type GetItemDetailLink = (id: number) => ItemDetailLink | null;

export interface TextFieldProps extends BaseFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	required?: boolean;
	error?: string;
}

export interface TextareaFieldProps extends BaseFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	rows?: number;
	error?: string;
}

export interface ImageUploadFieldProps extends BaseFieldProps {
	imageFieldName?: string;
	fallbackIcon: ElementType;
	altText?: string;
	onUpload: (file: File) => Promise<string>;
	isUploading?: boolean;
	autoSubmit?: boolean;
}

export interface SelectFieldProps extends BaseFieldProps {
	name: string;
	label: string;
	options: ReadonlyArray<{ value: string; label: string }>;
	description?: string;
	required?: boolean;
	error?: string;
}

export interface TagsFieldProps extends BaseFieldProps {
	name?: string;
	label?: string;
	allTags: { id: number; name: string }[];
	onTagCreate?: (name: string) => Promise<number>;
	error?: string;
}

export interface StringArrayFieldProps extends BaseFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	addButtonText: string;
	icon: ElementType;
	inputType?: "text" | "email" | "tel";
}

export interface EntityItem {
	id: number;
	name: string;
	image_url?: string | null;
}

export interface EntityMultiSelectFieldProps<T extends EntityItem>
	extends BaseFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	items: T[];
	onSearch?: (query: string) => void;
	isSearching?: boolean;
	renderItem: (item: T) => { title: string; description?: string };
	fallbackIcon: ElementType;
	error?: string;
	onSetEntities?: (ids: number[]) => void;
}
