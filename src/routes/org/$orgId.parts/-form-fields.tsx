import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import type { FieldStatus } from "@/hooks/use-auto-save";
import * as m from "@/paraglide/messages";
import {
	type PartFormValues,
	unitOfMeasureItems,
	useCurrencyList,
} from "./-types";

type PartFormApi = any;

interface FieldState<T> {
	state: { value: T };
	handleChange: (value: T) => void;
}

type StringFieldState = FieldState<string>;

interface FieldProps {
	form: PartFormApi;
	onFieldChange?: (fieldName: string) => void;
	status?: FieldStatus;
	required?: boolean;
}

interface NumberFieldProps extends FieldProps {
	name: keyof PartFormValues;
	label: string;
	placeholder?: string;
	error?: string;
	min?: number;
}

export function NumberField({
	form,
	name,
	label,
	placeholder,
	onFieldChange,
	status,
	required,
	error,
	min = 0,
}: NumberFieldProps) {
	return (
		<form.Field
			name={name}
			children={(field: StringFieldState) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{label}
						{required && <span className="text-destructive">*</span>}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<InputGroup>
						<InputGroupInput
							type="number"
							value={field.state.value}
							onChange={(e) => {
								field.handleChange(e.target.value);
								onFieldChange?.(name);
							}}
							placeholder={placeholder}
							required={required}
							min={name === "quantity" ? undefined : min}
						/>
					</InputGroup>
					{error && <FieldError>{error}</FieldError>}
				</Field>
			)}
		/>
	);
}

interface CurrencyFieldProps extends FieldProps {}

export function CurrencyField({
	form,
	onFieldChange,
	status,
}: CurrencyFieldProps) {
	const currencyList = useCurrencyList();

	return (
		<form.Field
			name="currency"
			children={(field: StringFieldState) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{m.parts_field_currency()}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<Combobox
						value={
							field.state.value
								? `${field.state.value} (${currencyList.find((c) => c.code === field.state.value)?.country ?? ""})`
								: null
						}
						onValueChange={(value) => {
							if (value) {
								const code = (value as string).split(" ")[0];
								field.handleChange(code);
								onFieldChange?.("currency");
							} else {
								field.handleChange("");
								onFieldChange?.("currency");
							}
						}}
						items={currencyList.map((c) => `${c.code} (${c.country})`)}
					>
						<ComboboxInput
							placeholder={m.parts_placeholder_currency()}
							showClear
						/>
						<ComboboxContent>
							<ComboboxList>
								{(item) => (
									<ComboboxItem key={item} value={item}>
										{item}
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</Field>
			)}
		/>
	);
}

interface UnitOfMeasureFieldProps extends FieldProps {}

export function UnitOfMeasureField({
	form,
	onFieldChange,
	status,
}: UnitOfMeasureFieldProps) {
	return (
		<form.Field
			name="unit_of_measure"
			children={(field: StringFieldState) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{m.parts_field_unit_of_measure()}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<Combobox
						value={field.state.value || null}
						onValueChange={(value) => {
							const newValue = (value as string) ?? "";
							if (newValue !== field.state.value) {
								field.handleChange(newValue);
								onFieldChange?.("unit_of_measure");
							}
						}}
						items={unitOfMeasureItems}
					>
						<ComboboxInput placeholder={m.parts_placeholder_unit()} showClear />
						<ComboboxContent>
							<ComboboxList>
								{(item) => (
									<ComboboxItem key={item} value={item}>
										{item}
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</Field>
			)}
		/>
	);
}
