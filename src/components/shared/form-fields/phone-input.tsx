import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
	type CountryOption,
	combinePhone,
	dialCountries,
	parsePhone,
} from "@/lib/countries";

interface PhoneInputProps {
	value: string;
	onChange: (next: string) => void;
	prefixPlaceholder?: string;
	numberPlaceholder?: string;
	emptyText: string;
}

export function PhoneInput({
	value,
	onChange,
	prefixPlaceholder,
	numberPlaceholder,
	emptyText,
}: PhoneInputProps) {
	const { dialIso2, number } = parsePhone(value);
	const selectedDial = dialCountries.find((c) => c.code === dialIso2) ?? null;

	return (
		<div className="flex gap-2">
			<Combobox
				items={dialCountries}
				value={selectedDial}
				onValueChange={(item: CountryOption | null) =>
					onChange(combinePhone(item?.code ?? "", number))
				}
				itemToStringLabel={(item: CountryOption | null) =>
					item ? `+${item.dial}` : ""
				}
				itemToStringValue={(item: CountryOption | null) => item?.code ?? ""}
				isItemEqualToValue={(
					a: CountryOption | null,
					b: CountryOption | null,
				) => a?.code === b?.code}
				filter={(item: CountryOption, search: string) => {
					const q = search.toLowerCase();
					return (
						item.name.toLowerCase().includes(q) ||
						item.code.toLowerCase().includes(q) ||
						item.dial.includes(q)
					);
				}}
			>
				<ComboboxInput
					className="w-40 shrink-0"
					placeholder={prefixPlaceholder}
				/>
				<ComboboxContent>
					<ComboboxList>
						{(item: CountryOption) => (
							<ComboboxItem key={item.code} value={item}>
								+{item.dial}
							</ComboboxItem>
						)}
					</ComboboxList>
					<ComboboxEmpty>{emptyText}</ComboboxEmpty>
				</ComboboxContent>
			</Combobox>
			<InputGroup className="flex-1">
				<InputGroupInput
					type="tel"
					value={number}
					onChange={(e) => onChange(combinePhone(dialIso2, e.target.value))}
					placeholder={numberPlaceholder}
				/>
			</InputGroup>
		</div>
	);
}
