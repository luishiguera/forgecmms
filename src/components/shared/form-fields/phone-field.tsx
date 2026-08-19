import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { PhoneInput } from "./phone-input";
import type { BaseFieldProps } from "./types";

interface PhoneFieldProps extends BaseFieldProps {
	name: string;
	label: string;
	prefixPlaceholder?: string;
	numberPlaceholder?: string;
	emptyText: string;
	error?: string;
}

export function PhoneField({
	form,
	name,
	label,
	prefixPlaceholder,
	numberPlaceholder,
	emptyText,
	onFieldChange,
	status,
	error,
}: PhoneFieldProps) {
	return (
		<form.Field name={name}>
			{(field: {
				state: { value: string };
				handleChange: (v: string) => void;
			}) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{label}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<PhoneInput
						value={field.state.value}
						onChange={(v) => {
							field.handleChange(v);
							onFieldChange?.(name);
						}}
						prefixPlaceholder={prefixPlaceholder}
						numberPlaceholder={numberPlaceholder}
						emptyText={emptyText}
					/>
					{error && <FieldError>{error}</FieldError>}
				</Field>
			)}
		</form.Field>
	);
}
