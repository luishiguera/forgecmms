import { DesktopIcon } from "@phosphor-icons/react/dist/csr/Desktop";
import { DeviceMobileIcon } from "@phosphor-icons/react/dist/csr/DeviceMobile";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Access } from "@/server/domains/organizations/schema";

export type AccessKey = Access;

interface AccessLabels {
	desk: string;
	field: string;
}

interface AccessBadgesProps {
	accesses: AccessKey[] | undefined;
	labels: AccessLabels;
}

export function AccessBadges({ accesses, labels }: AccessBadgesProps) {
	const list = accesses ?? [];
	return (
		<>
			{list.includes("backoffice") && (
				<Badge
					variant="outline"
					className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20 gap-1"
				>
					<DesktopIcon className="size-3" weight="fill" />
					{labels.desk}
				</Badge>
			)}
			{list.includes("field") && (
				<Badge
					variant="outline"
					className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/20 gap-1"
				>
					<DeviceMobileIcon className="size-3" weight="fill" />
					{labels.field}
				</Badge>
			)}
		</>
	);
}

interface AccessCheckboxGroupProps {
	value: AccessKey[];
	onChange: (next: AccessKey[]) => void;
	labels: AccessLabels & {
		deskDescription: string;
		fieldDescription: string;
	};
}

export function AccessCheckboxGroup({
	value,
	onChange,
	labels,
}: AccessCheckboxGroupProps) {
	const toggle = (key: AccessKey) => {
		const next = value.includes(key)
			? value.filter((v) => v !== key)
			: [...value, key];
		if (next.length > 0) onChange(next);
	};
	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors text-left"
				onClick={() => toggle("backoffice")}
			>
				<Checkbox checked={value.includes("backoffice")} />
				<div className="flex flex-col">
					<span className="text-sm font-medium">{labels.desk}</span>
					<span className="text-xs text-muted-foreground">
						{labels.deskDescription}
					</span>
				</div>
			</button>
			<button
				type="button"
				className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors text-left"
				onClick={() => toggle("field")}
			>
				<Checkbox checked={value.includes("field")} />
				<div className="flex flex-col">
					<span className="text-sm font-medium">{labels.field}</span>
					<span className="text-xs text-muted-foreground">
						{labels.fieldDescription}
					</span>
				</div>
			</button>
		</div>
	);
}
