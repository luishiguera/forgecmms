import type { Icon } from "@phosphor-icons/react";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import type { ReactNode } from "react";
import * as m from "@/paraglide/messages";

export function SectionHeader({ title }: { title: string }) {
	return <p className="text-sm font-semibold">{title}</p>;
}

export function InfoRow({
	icon: RowIcon,
	label,
	value,
	valueSuffix,
	subline,
}: {
	icon: Icon;
	label: string;
	value?: string;
	valueSuffix?: string;
	subline?: string;
}) {
	return (
		<div className="flex items-start gap-3">
			<RowIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
			<div className="min-w-0">
				<p className="text-xs font-medium text-muted-foreground">{label}</p>
				{value && (
					<p className="mt-0.5 truncate text-[15px] font-medium">
						{value}
						{valueSuffix && (
							<span className="font-semibold text-muted-foreground">
								{valueSuffix}
							</span>
						)}
					</p>
				)}
				{subline && (
					<p className="mt-0.5 text-xs text-muted-foreground">{subline}</p>
				)}
			</div>
		</div>
	);
}

export function RelatedItem({
	icon: ItemIcon,
	title,
	subtitle,
	imageUrl,
	href,
	leading,
	trailing,
	onClick,
}: {
	icon: Icon;
	title: string;
	subtitle?: ReactNode;
	imageUrl?: string | null;
	href?: string;
	leading?: ReactNode;
	trailing?: ReactNode;
	onClick?: () => void;
}) {
	const media = imageUrl ? (
		<img
			src={imageUrl}
			alt={title}
			className="size-10 shrink-0 rounded-md object-cover"
		/>
	) : (
		(leading ?? <ItemIcon className="size-5 shrink-0 text-muted-foreground" />)
	);

	const body = (
		<>
			{media}
			<span className="min-w-0 flex-1 text-left">
				<span className="block truncate text-[13px] font-medium">{title}</span>
				{subtitle && (
					<span className="block truncate text-xs text-muted-foreground">
						{subtitle}
					</span>
				)}
			</span>
		</>
	);

	const interactive = "flex min-w-0 flex-1 items-center gap-3";

	return (
		<div className="flex items-center gap-3 rounded-lg p-3 ring-1 ring-border">
			{href && (
				<a href={href} target="_blank" rel="noreferrer" className={interactive}>
					{body}
				</a>
			)}
			{!href && onClick && (
				<button type="button" onClick={onClick} className={interactive}>
					{body}
				</button>
			)}
			{!href && !onClick && body}
			{trailing}
			{onClick && (
				<button
					type="button"
					onClick={onClick}
					aria-label={m.field_open()}
					className="p-1 text-muted-foreground"
				>
					<CaretRightIcon className="size-5 shrink-0" />
				</button>
			)}
		</div>
	);
}

export function AddItemCard({
	icon: CardIcon,
	label,
	onClick,
}: {
	icon: Icon;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-border py-3.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/40"
		>
			<CardIcon className="size-[18px]" />
			{label}
		</button>
	);
}

export function EmptyStateCard({
	icon: CardIcon,
	label,
}: {
	icon: Icon;
	label: string;
}) {
	return (
		<div className="flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-[13px] font-medium text-muted-foreground ring-1 ring-border">
			<CardIcon className="size-[18px]" />
			{label}
		</div>
	);
}
