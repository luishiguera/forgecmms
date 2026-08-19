import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { FunnelIcon } from "@phosphor-icons/react/dist/csr/Funnel";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { businessTypeLabel } from "@/components/shared/business-type-badges";
import { MultiFilterSection } from "@/components/shared/multi-filter-section";
import { Button } from "@/components/ui/button";
import { FilterTrigger } from "@/components/ui/filter-trigger";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	PanelEmpty,
	PanelLayout,
	PanelList,
} from "@/components/ui/panel-layout";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { VirtualPanelList } from "@/components/ui/virtual-panel-list";
import { useDebounce } from "@/hooks/use-debounce";
import { businessesInfiniteQueryOptions } from "@/lib/queries/businesses";
import * as m from "@/paraglide/messages";
import { BusinessListItem } from "./$orgId.businesses/-components";
import { BusinessCreatePanel } from "./$orgId.businesses/-create-panel";
import { BusinessDetailPanel } from "./$orgId.businesses/-detail-panel";

const searchSchema = z.object({
	id: z.number().optional(),
	q: z.string().optional(),
	type: z.enum(["customer", "vendor", "both"]).optional(),
	tab: z.enum(["overview", "related"]).optional(),
});

type BusinessType = "customer" | "vendor" | "both";

const TYPE_OPTIONS: BusinessType[] = ["customer", "vendor", "both"];

export const Route = createFileRoute("/org/$orgId/businesses")({
	validateSearch: searchSchema,
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId } = Route.useParams();
	const searchParams = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const search = searchParams.q ?? "";
	const debouncedSearch = useDebounce(search, 300);
	const [isCreating, setIsCreating] = useState(false);
	const selectedBusinessId = searchParams.id ?? null;
	const setSelectedBusinessId = (id: number | null) => {
		setIsCreating(false);
		navigate({
			search: (prev) => ({ ...prev, id: id ?? undefined }),
			replace: true,
		});
	};

	const {
		data: businessesData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		businessesInfiniteQueryOptions(orgId, {
			size: 20,
			q: debouncedSearch || undefined,
			type: searchParams.type,
		}),
	);

	const businesses =
		businessesData?.pages.flatMap((page) => page.items ?? []).filter(Boolean) ??
		[];

	const typeLabelByOption = new Map(
		TYPE_OPTIONS.map((option) => [businessTypeLabel(option), option]),
	);

	return (
		<>
			<PanelLayout className="flex-1 min-h-0">
				<PanelList>
					<div className="p-3 border-b border-border shrink-0 flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								{m.biz_count({ count: businesses.length })}
							</span>
							<Button
								size="icon-sm"
								onClick={() => {
									navigate({
										search: (prev) => ({ ...prev, id: undefined }),
										replace: true,
									});
									setIsCreating(true);
								}}
							>
								<PlusIcon weight="bold" />
							</Button>
						</div>
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<MagnifyingGlassIcon className="size-4" weight="duotone" />
							</InputGroupAddon>
							<InputGroupInput
								type="search"
								placeholder={m.biz_search_placeholder()}
								value={search}
								onChange={(e) =>
									navigate({
										search: (prev) => ({
											...prev,
											q: e.target.value || undefined,
										}),
									})
								}
							/>
						</InputGroup>
						<div className="flex flex-wrap gap-1.5">
							<Popover>
								<FilterTrigger
									icon={FunnelIcon}
									label={m.biz_filter_type()}
									count={searchParams.type ? 1 : 0}
									selectedLabel={
										searchParams.type
											? businessTypeLabel(searchParams.type)
											: undefined
									}
									onClear={() =>
										navigate({
											search: (prev) => ({ ...prev, type: undefined }),
											replace: true,
										})
									}
								/>
								<PopoverContent align="start" className="w-48 p-0 gap-0">
									<MultiFilterSection
										label={m.biz_filter_type()}
										options={TYPE_OPTIONS.map((option) =>
											businessTypeLabel(option),
										)}
										values={
											searchParams.type
												? [businessTypeLabel(searchParams.type)]
												: []
										}
										onChange={(v) => {
											const selected = v[v.length - 1];
											const type = selected
												? typeLabelByOption.get(selected)
												: undefined;
											navigate({
												search: (prev) => ({ ...prev, type }),
												replace: true,
											});
										}}
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<VirtualPanelList
						items={businesses}
						isLoading={isLoading}
						hasNextPage={hasNextPage ?? false}
						isFetchingNextPage={isFetchingNextPage}
						fetchNextPage={fetchNextPage}
						getItemKey={(business) => business.id}
						estimateSize={56}
						emptyState={
							<div className="flex items-center justify-center h-full p-6">
								<div className="text-center text-muted-foreground">
									<BuildingsIcon
										className="size-8 mx-auto mb-2 opacity-50"
										weight="duotone"
									/>
									<p className="text-sm">{m.biz_empty_title()}</p>
								</div>
							</div>
						}
						renderItem={(business) => (
							<BusinessListItem
								business={business}
								isSelected={selectedBusinessId === business.id}
								onClick={() => setSelectedBusinessId(business.id)}
							/>
						)}
					/>
				</PanelList>

				{isCreating ? (
					<BusinessCreatePanel
						orgId={orgId}
						onCreated={(id) => {
							setIsCreating(false);
							setSelectedBusinessId(id);
						}}
						onCancel={() => setIsCreating(false)}
					/>
				) : selectedBusinessId ? (
					<BusinessDetailPanel
						key={selectedBusinessId}
						businessId={selectedBusinessId}
						orgId={orgId}
						activeTab={searchParams.tab ?? "overview"}
						onTabChange={(tab) =>
							navigate({
								search: (prev) => ({
									...prev,
									tab: tab === "overview" ? undefined : tab,
								}),
								replace: true,
							})
						}
					/>
				) : (
					<PanelEmpty>
						<BuildingsIcon
							className="size-12 text-muted-foreground/50"
							weight="duotone"
						/>
						<p className="text-muted-foreground">{m.biz_empty_select()}</p>
					</PanelEmpty>
				)}
			</PanelLayout>
		</>
	);
}
