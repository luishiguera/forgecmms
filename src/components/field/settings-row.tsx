import type { Icon } from "@phosphor-icons/react";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { cn } from "@/lib/utils";

export function SettingsSection({ title }: { title: string }) {
	return (
		<p className="px-1 pt-2 text-xs font-semibold tracking-[0.3px] text-muted-foreground uppercase">
			{title}
		</p>
	);
}

export function SettingsRow({
	icon: RowIcon,
	title,
	subtitle,
	destructive,
	onClick,
}: {
	icon: Icon;
	title: string;
	subtitle?: string;
	destructive?: boolean;
	onClick?: () => void;
}) {
	const content = (
		<>
			<RowIcon
				className={cn(
					"size-5 shrink-0",
					destructive ? "text-destructive" : "text-muted-foreground",
				)}
			/>
			<span className="min-w-0 flex-1 text-left">
				<span
					className={cn(
						"block truncate text-[15px] font-medium",
						destructive && "text-destructive",
					)}
				>
					{title}
				</span>
				{subtitle && (
					<span className="block truncate text-[13px] text-muted-foreground">
						{subtitle}
					</span>
				)}
			</span>
			{onClick && (
				<CaretRightIcon className="size-5 shrink-0 text-muted-foreground" />
			)}
		</>
	);

	if (!onClick) {
		return (
			<div className="flex items-center gap-3 rounded-lg p-3.5 ring-1 ring-border">
				{content}
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center gap-3 rounded-lg p-3.5 ring-1 ring-border transition-colors hover:bg-muted/40"
		>
			{content}
		</button>
	);
}

export function OptionSheetItem({
	label,
	isSelected,
	onClick,
}: {
	label: string;
	isSelected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3.5 text-left text-[15px] ring-1",
				isSelected
					? "bg-primary/10 font-medium text-primary ring-primary"
					: "ring-border",
			)}
		>
			{label}
		</button>
	);
}
