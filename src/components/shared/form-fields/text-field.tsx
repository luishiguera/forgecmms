import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import type { TextFieldProps } from "./types";

export function TextField({
	form,
	name,
	label,
	placeholder,
	required,
	error,
	onFieldChange,
	status,
}: TextFieldProps) {
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
							{required && <span className="text-destructive">*</span>}
							{status && <FieldStatusIndicator status={status} />}
						</FieldLabel>
						<InputGroup>
							<InputGroupInput
								value={field.state.value}
								onChange={(e) => {
									field.handleChange(e.target.value);
									onFieldChange?.(name);
								}}
								onBlur={field.handleBlur}
								placeholder={placeholder}
								required={required}
								aria-invalid={isInvalid || undefined}
							/>
						</InputGroup>
						{displayError && <FieldError>{displayError}</FieldError>}
					</Field>
				);
			}}
		/>
	);
}
