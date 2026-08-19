import { addMonths } from "date-fns";
import type { Matcher } from "react-day-picker";

export function maxRangeMatcher(
	from: Date | undefined,
	to: Date | undefined,
	maxMonths = 3,
): Matcher[] | undefined {
	if (from && !to) {
		return [{ before: from }, { after: addMonths(from, maxMonths) }];
	}
	return undefined;
}
