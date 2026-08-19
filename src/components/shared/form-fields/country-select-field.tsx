import { getEmojiFlag } from "countries-list";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { type CountryOption, countries } from "@/lib/countries";
import type { BaseFieldProps } from "./types";

interface CountrySelectFieldProps extends BaseFieldProps {
	name: string;
	label: string;
	placeholder?: string;
	emptyText: string;
	error?: string;
}

export function CountrySelectField({
	form,
	name,
	label,
	placeholder,
	emptyText,
	onFieldChange,
	status,
	error,
}: CountrySelectFieldProps) {
	return (
		<form.Field name={name}>
			{(field: {
				state: { value: string };
				handleChange: (v: string) => void;
			}) => {
				const selected =
					countries.find((c) => c.code === field.state.value) ?? null;
				return (
					<Field>
						<FieldLabel className="flex items-center gap-1.5">
							{label}
							{status && <FieldStatusIndicator status={status} />}
						</FieldLabel>
						<Combobox
							items={countries}
							value={selected}
							onValueChange={(item: CountryOption | null) => {
								field.handleChange(item?.code ?? "");
								onFieldChange?.(name);
							}}
							itemToStringLabel={(item: CountryOption | null) =>
								item ? `${getEmojiFlag(item.code)} ${item.name}` : ""
							}
							itemToStringValue={(item: CountryOption | null) =>
								item?.code ?? ""
							}
							isItemEqualToValue={(
								a: CountryOption | null,
								b: CountryOption | null,
							) => a?.code === b?.code}
							filter={(item: CountryOption, search: string) =>
								item.name.toLowerCase().includes(search.toLowerCase()) ||
								item.code.toLowerCase().includes(search.toLowerCase())
							}
						>
							<ComboboxInput placeholder={placeholder} showClear />
							<ComboboxContent>
								<ComboboxList>
									{(item: CountryOption) => (
										<ComboboxItem key={item.code} value={item}>
											{getEmojiFlag(item.code)} {item.name}
										</ComboboxItem>
									)}
								</ComboboxList>
								<ComboboxEmpty>{emptyText}</ComboboxEmpty>
							</ComboboxContent>
						</Combobox>
						{error && <FieldError>{error}</FieldError>}
					</Field>
				);
			}}
		</form.Field>
	);
}
