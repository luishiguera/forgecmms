import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import * as m from "@/paraglide/messages";
import { TagsCombobox } from "./tags-combobox";
import type { TagsFieldProps } from "./types";

export function TagsField({
	form,
	name = "tag_ids",
	label,
	allTags,
	onTagCreate,
	error,
	onFieldChange,
	status,
}: TagsFieldProps) {
	const resolvedLabel = label ?? m.shared_field_tags();

	return (
		<form.Field
			name={name}
			children={(field: {
				state: { value: number[] };
				handleChange: (v: number[]) => void;
			}) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{resolvedLabel}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<TagsCombobox
						value={field.state.value}
						onChange={(ids) => {
							field.handleChange(ids);
							onFieldChange?.(name);
						}}
						allTags={allTags}
						onTagCreate={onTagCreate}
					/>
					{error && <FieldError>{error}</FieldError>}
				</Field>
			)}
		/>
	);
}
