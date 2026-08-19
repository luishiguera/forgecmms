import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { Button } from "@/components/ui/button";
import * as m from "@/paraglide/messages";

export function FieldAppBar({
	title,
	onBack,
	onRefresh,
}: {
	title: string;
	onBack: () => void;
	onRefresh?: () => void;
}) {
	return (
		<header className="flex h-14 shrink-0 items-center gap-1 border-b border-border/70 px-2">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label={m.field_back()}
				onClick={onBack}
			>
				<CaretLeftIcon className="size-5" weight="bold" />
			</Button>

			<span className="flex-1 text-center text-lg font-semibold">{title}</span>

			{onRefresh ? (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label={m.field_refresh()}
					onClick={onRefresh}
				>
					<ArrowClockwiseIcon className="size-[22px] text-muted-foreground" />
				</Button>
			) : (
				<span className="size-9" />
			)}
		</header>
	);
}
