import type * as React from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PanelLayoutProps {
	children: React.ReactNode;
	className?: string;
}

function PanelLayout({ children, className }: PanelLayoutProps) {
	return (
		<div
			data-slot="panel-layout"
			className={cn(
				"flex h-full min-h-0 border-t bg-card overflow-hidden",
				className,
			)}
		>
			{children}
		</div>
	);
}

interface PanelListProps {
	children: React.ReactNode;
	className?: string;
	header?: React.ReactNode;
}

function PanelList({ children, className, header }: PanelListProps) {
	return (
		<div
			data-slot="panel-list"
			className={cn(
				"flex w-80 shrink-0 flex-col border-r h-full min-h-0 overflow-hidden",
				className,
			)}
		>
			{header && <div className="shrink-0 border-b p-3">{header}</div>}
			{children}
		</div>
	);
}

interface PanelListContentProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	className?: string;
}

const PanelListContent = forwardRef<HTMLDivElement, PanelListContentProps>(
	({ children, className, ...props }, ref) => {
		return (
			<div
				ref={ref}
				data-slot="panel-list-content"
				className={cn("flex-1 min-h-0 overflow-y-auto no-scrollbar", className)}
				{...props}
			>
				{children}
			</div>
		);
	},
);
PanelListContent.displayName = "PanelListContent";

interface PanelListItemProps extends React.ComponentProps<"button"> {
	isSelected?: boolean;
}

function PanelListItem({
	children,
	className,
	isSelected,
	...props
}: PanelListItemProps) {
	return (
		<button
			type="button"
			data-slot="panel-list-item"
			data-active={isSelected}
			className={cn(
				"flex w-full items-start gap-3 border-b p-3 text-left transition-colors hover:bg-accent/50 cursor-pointer",
				"data-[active=true]:bg-accent",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

function PanelListItemAvatar({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="panel-list-item-avatar"
			className={cn(
				"flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground",
				className,
			)}
		>
			{children}
		</div>
	);
}

function PanelListItemContent({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="panel-list-item-content"
			className={cn("flex flex-1 flex-col gap-0.5 min-w-0", className)}
		>
			{children}
		</div>
	);
}

function PanelListItemTitle({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="panel-list-item-title"
			className={cn("font-medium text-sm truncate", className)}
		>
			{children}
		</div>
	);
}

function PanelListItemSubtitle({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="panel-list-item-subtitle"
			className={cn("text-xs text-muted-foreground truncate", className)}
		>
			{children}
		</div>
	);
}

function PanelListItemMeta({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div data-slot="panel-list-item-meta" className={cn("shrink-0", className)}>
			{children}
		</div>
	);
}

interface PanelDetailProps {
	children: React.ReactNode;
	className?: string;
}

function PanelDetail({ children, className }: PanelDetailProps) {
	return (
		<div
			data-slot="panel-detail"
			className={cn(
				"flex flex-1 flex-col min-w-0 overflow-y-auto no-scrollbar",
				className,
			)}
		>
			{children}
		</div>
	);
}

interface PanelDetailHeaderProps {
	children?: React.ReactNode;
	className?: string;
	title?: React.ReactNode;
	subtitle?: string;
	actions?: React.ReactNode;
}

function PanelDetailHeader({
	children,
	className,
	title,
	subtitle,
	actions,
}: PanelDetailHeaderProps) {
	if (children) {
		return (
			<div
				data-slot="panel-detail-header"
				className={cn("shrink-0 border-b p-6", className)}
			>
				{children}
			</div>
		);
	}

	return (
		<div
			data-slot="panel-detail-header"
			className={cn(
				"flex items-start justify-between shrink-0 border-b p-6",
				className,
			)}
		>
			<div className="min-w-0">
				{title && <h2 className="text-lg font-semibold truncate">{title}</h2>}
				{subtitle && (
					<p className="text-sm text-muted-foreground truncate">{subtitle}</p>
				)}
			</div>
			{actions && <div className="shrink-0 ml-4">{actions}</div>}
		</div>
	);
}

function PanelDetailContent({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="panel-detail-content"
			className={cn("flex-1 p-6 flex flex-col gap-8", className)}
		>
			{children}
		</div>
	);
}

function PanelDetailSection({
	children,
	className,
	title,
	icon,
	action,
}: {
	children: React.ReactNode;
	className?: string;
	title: string;
	icon?: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div data-slot="panel-detail-section" className={cn("", className)}>
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					{icon}
					{title}
				</div>
				{action}
			</div>
			<div>{children}</div>
		</div>
	);
}

function PanelDetailField({
	label,
	children,
	className,
	icon,
	action,
}: {
	label: string;
	children: React.ReactNode;
	className?: string;
	icon?: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div data-slot="panel-detail-field" className={cn("mb-4", className)}>
			<div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
				{icon}
				{label}
				{action}
			</div>
			<div className="text-sm">{children}</div>
		</div>
	);
}

function PanelEmpty({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="panel-empty"
			className={cn(
				"flex flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground",
				className,
			)}
		>
			{children}
		</div>
	);
}

interface ItemListProps {
	children: React.ReactNode;
	className?: string;
}

function ItemList({ children, className }: ItemListProps) {
	return (
		<div data-slot="item-list" className={cn("flex flex-col gap-2", className)}>
			{children}
		</div>
	);
}

interface ItemCardProps extends React.ComponentProps<"div"> {
	children: React.ReactNode;
}

function ItemCard({ children, className, ...props }: ItemCardProps) {
	return (
		<div
			data-slot="item-card"
			className={cn(
				"group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

function ItemCardIcon({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="item-card-icon"
			className={cn(
				"flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
				className,
			)}
		>
			{children}
		</div>
	);
}

function ItemCardContent({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="item-card-content"
			className={cn("flex flex-1 flex-col gap-0.5 min-w-0", className)}
		>
			{children}
		</div>
	);
}

function ItemCardTitle({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="item-card-title"
			className={cn("font-medium text-sm truncate", className)}
		>
			{children}
		</div>
	);
}

function ItemCardDescription({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="item-card-description"
			className={cn("text-xs text-muted-foreground truncate", className)}
		>
			{children}
		</div>
	);
}

function ItemCardMeta({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="item-card-meta"
			className={cn("flex shrink-0 items-center gap-3 text-sm", className)}
		>
			{children}
		</div>
	);
}

function ItemCardActions({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			data-slot="item-card-actions"
			className={cn(
				"flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
				className,
			)}
		>
			{children}
		</div>
	);
}

export {
	ItemCard,
	ItemCardActions,
	ItemCardContent,
	ItemCardDescription,
	ItemCardIcon,
	ItemCardMeta,
	ItemCardTitle,
	ItemList,
	PanelDetail,
	PanelDetailContent,
	PanelDetailField,
	PanelDetailHeader,
	PanelDetailSection,
	PanelEmpty,
	PanelLayout,
	PanelList,
	PanelListContent,
	PanelListItem,
	PanelListItemAvatar,
	PanelListItemContent,
	PanelListItemMeta,
	PanelListItemSubtitle,
	PanelListItemTitle,
};
