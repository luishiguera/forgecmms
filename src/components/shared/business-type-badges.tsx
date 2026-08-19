import { Badge } from "@/components/ui/badge";
import * as m from "@/paraglide/messages";

export function businessTypeLabel(type: string): string {
	switch (type) {
		case "vendor":
			return m.biz_type_vendor();
		case "both":
			return m.biz_type_both();
		default:
			return m.biz_type_customer();
	}
}

export function BusinessTypeBadges({ type }: { type: string }) {
	if (type === "both") {
		return (
			<>
				<Badge variant="secondary">{m.biz_type_customer()}</Badge>
				<Badge variant="secondary">{m.biz_type_vendor()}</Badge>
			</>
		);
	}
	return <Badge variant="secondary">{businessTypeLabel(type)}</Badge>;
}
