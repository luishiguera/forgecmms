import { getCountryDataList, type TCountryCode } from "countries-list";

export type CountryOption = { code: TCountryCode; name: string; dial: string };

export const countries: CountryOption[] = getCountryDataList()
	.map((c) => ({
		code: c.iso2,
		name: c.name,
		dial: c.phone?.[0] != null ? String(c.phone[0]) : "",
	}))
	.sort((a, b) => a.name.localeCompare(b.name));

export const dialCountries = countries.filter((c) => c.dial);

export function parsePhone(value: string): {
	dialIso2: TCountryCode | "";
	number: string;
} {
	if (value.startsWith("+")) {
		const spaceIdx = value.indexOf(" ");
		const codePart = (spaceIdx === -1 ? value : value.slice(0, spaceIdx)).slice(
			1,
		);
		const rest = spaceIdx === -1 ? "" : value.slice(spaceIdx + 1);
		const match = dialCountries.find((c) => c.dial === codePart);
		return { dialIso2: match?.code ?? "", number: rest };
	}
	return { dialIso2: "", number: value };
}

export function combinePhone(
	dialIso2: TCountryCode | "",
	number: string,
): string {
	const dial = dialIso2
		? (countries.find((c) => c.code === dialIso2)?.dial ?? "")
		: "";
	return dial ? (number ? `+${dial} ${number}` : `+${dial}`) : number;
}
