import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { SelectFieldProps } from "./types";

export function SelectField({
	form,
	name,
	label,
	options,
	description,
	onFieldChange,
	status,
	required,
	error,
}: SelectFieldProps) {
	return (
		<form.Field name={name}>
			{(field: {
				state: { value: string };
				handleChange: (v: string) => void;
			}) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{label}
						{required && <span className="text-destructive">*</span>}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					{description && <FieldDescription>{description}</FieldDescription>}
					<Select
						value={field.state.value}
						onValueChange={(value) => {
							if (value) {
								field.handleChange(value);
								onFieldChange?.(name);
							}
						}}
					>
						<SelectTrigger>
							<SelectValue>
								{(value: string) => {
									const option = options.find((o) => o.value === value);
									return option?.label ?? value;
								}}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{error && <FieldError>{error}</FieldError>}
				</Field>
			)}
		</form.Field>
	);
}
