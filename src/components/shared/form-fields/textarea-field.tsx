import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { Textarea } from "@/components/ui/textarea";
import type { TextareaFieldProps } from "./types";

export function TextareaField({
	form,
	name,
	label,
	placeholder,
	rows = 3,
	error,
	onFieldChange,
	status,
}: TextareaFieldProps) {
	return (
		<form.Field
			name={name}
			children={(field: {
				state: {
					value: string;
					meta: { isTouched: boolean; isValid: boolean; errors: string[] };
				};
				handleChange: (v: string) => void;
				handleBlur: () => void;
			}) => {
				const isInvalid =
					field.state.meta.isTouched && !field.state.meta.isValid;
				const fieldErrors = field.state.meta.errors;
				const displayError =
					isInvalid && fieldErrors.length > 0 ? fieldErrors.join(", ") : error;

				return (
					<Field data-invalid={isInvalid || undefined}>
						<FieldLabel className="flex items-center gap-1.5">
							{label}
							{status && <FieldStatusIndicator status={status} />}
						</FieldLabel>
						<Textarea
							value={field.state.value}
							onChange={(e) => {
								field.handleChange(e.target.value);
								onFieldChange?.(name);
							}}
							onBlur={field.handleBlur}
							placeholder={placeholder}
							rows={rows}
							aria-invalid={isInvalid || undefined}
						/>
						{displayError && <FieldError>{displayError}</FieldError>}
					</Field>
				);
			}}
		/>
	);
}
