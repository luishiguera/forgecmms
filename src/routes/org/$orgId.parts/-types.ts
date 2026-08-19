import { getCountryDataList } from "countries-list";
import { useMemo } from "react";

export interface PartFormValues {
	sku: string;
	name: string;
	description: string;
	quantity: string;
	min_quantity: string;
	unit_price: string;
	currency: string;
	unit_of_measure: string;
	image_url: string;
	tag_ids: number[];
}

export const DEFAULT_CREATE_VALUES: PartFormValues = {
	sku: "",
	name: "",
	description: "",
	quantity: "",
	min_quantity: "0",
	unit_price: "0",
	currency: "",
	unit_of_measure: "",
	image_url: "",
	tag_ids: [],
};

export type PartFormMode = "create" | "edit";

export function isLowStock(quantity: number, minQuantity: number): boolean {
	return quantity < minQuantity;
}

export const unitOfMeasureItems = [
	"Each",
	"Set",
	"Kit",
	"Pair",
	"Box",
	"Roll",
	"Meter",
	"Foot",
	"Kg",
	"Lb",
	"Liter",
	"Gallon",
];

export function useCurrencyList() {
	return useMemo(() => {
		const seen = new Set<string>();
		const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });
		return getCountryDataList()
			.flatMap((c) => c.currency ?? [])
			.filter((code) => {
				if (!code || seen.has(code)) return false;
				seen.add(code);
				return true;
			})
			.map((code) => ({
				code,
				country: displayNames.of(code) ?? code,
			}))
			.sort((a, b) => a.code.localeCompare(b.code));
	}, []);
}
