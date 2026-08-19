import { useVirtualizer } from "@tanstack/react-virtual";
import { type ReactNode, useEffect, useRef } from "react";
import { Spinner } from "./spinner";

interface VirtualPanelListProps<T> {
	items: T[];
	isLoading: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	fetchNextPage: () => void;
	renderItem: (item: T, index: number) => ReactNode;
	getItemKey: (item: T) => string | number;
	emptyState: ReactNode;
	loadingState?: ReactNode;
	estimateSize?: number;
	overscan?: number;
}

export function VirtualPanelList<T>({
	items,
	isLoading,
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
	renderItem,
	getItemKey,
	emptyState,
	loadingState,
	estimateSize = 64,
	overscan = 5,
}: VirtualPanelListProps<T>) {
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => estimateSize,
		overscan,
		getItemKey: (index) => getItemKey(items[index]),
	});

	const virtualItems = virtualizer.getVirtualItems();

	useEffect(() => {
		const lastItem = virtualItems[virtualItems.length - 1];
		if (!lastItem) return;

		if (
			lastItem.index >= items.length - 1 - overscan &&
			hasNextPage &&
			!isFetchingNextPage
		) {
			fetchNextPage();
		}
	}, [
		virtualItems,
		items.length,
		overscan,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	]);

	if (isLoading) {
		return (
			loadingState ?? (
				<div className="flex items-center justify-center h-full p-6">
					<Spinner className="size-6" />
				</div>
			)
		);
	}

	if (items.length === 0) {
		return <>{emptyState}</>;
	}

	return (
		<div
			ref={parentRef}
			className="flex-1 min-h-0 overflow-y-auto no-scrollbar"
			data-slot="panel-list-content"
		>
			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{virtualItems.map((virtualItem) => (
					<div
						key={virtualItem.key}
						data-index={virtualItem.index}
						ref={virtualizer.measureElement}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							transform: `translateY(${virtualItem.start}px)`,
						}}
					>
						{renderItem(items[virtualItem.index], virtualItem.index)}
					</div>
				))}
			</div>
			{isFetchingNextPage && (
				<div className="flex items-center justify-center p-4">
					<Spinner className="size-4" />
				</div>
			)}
		</div>
	);
}
