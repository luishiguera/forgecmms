import type { Icon } from "@phosphor-icons/react";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FilterTriggerProps {
	icon: Icon;
	label: string;
	count?: number;
	className?: string;
	selectedLabel?: string;
	onClear?: () => void;
}

export function FilterTrigger({
	icon: Icon,
	label,
	count = 0,
	onClear,
	selectedLabel,
	className,
}: FilterTriggerProps) {
	return (
		<PopoverTrigger
			render={(props) => (
				<button
					{...props}
					type="button"
					className={cn(
						"inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors cursor-pointer",
						count > 0
							? "bg-primary/10 border-primary/30 text-primary"
							: "border-border hover:bg-accent",
						className,
					)}
				>
					<Icon className="size-3" weight="duotone" />
					{count === 0
						? label
						: count === 1 && selectedLabel
							? selectedLabel
							: `${count} ${label === "Status" ? "statuses" : label === "Category" ? "categories" : `${label.toLowerCase()}s`}`}
					{count > 0 && onClear && (
						<span
							role="button"
							onClick={(e) => {
								e.stopPropagation();
								onClear();
							}}
							className="ml-0.5 hover:bg-primary/20 rounded-sm p-0.5"
						>
							<XIcon className="size-2.5" weight="bold" />
						</span>
					)}
				</button>
			)}
		/>
	);
}
