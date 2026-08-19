import { FunnelIcon } from "@phosphor-icons/react/dist/csr/Funnel";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
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
import { locationsInfiniteQueryOptions } from "@/lib/queries/locations";
import { tagsQueryOptions } from "@/lib/queries/tags";
import * as m from "@/paraglide/messages";
import { LocationListItem } from "./$orgId.locations/-components";
import { LocationCreatePanel } from "./$orgId.locations/-create-panel";
import { LocationDetailPanel } from "./$orgId.locations/-detail-panel";

const searchSchema = z.object({
	id: z.number().optional(),
	q: z.string().optional(),
	tag_id: z.number().optional(),
	tab: z.enum(["overview", "related", "attachments"]).optional(),
});

export const Route = createFileRoute("/org/$orgId/locations")({
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
	const selectedLocationId = searchParams.id ?? null;
	const setSelectedLocationId = (id: number | null) => {
		setIsCreating(false);
		navigate({
			search: (prev) => ({ ...prev, id: id ?? undefined }),
			replace: true,
		});
	};
	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "location"));

	const {
		data: locationsData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		locationsInfiniteQueryOptions(orgId, {
			size: 20,
			q: debouncedSearch || undefined,
			tag_id: searchParams.tag_id,
		}),
	);

	const tags = tagsData ?? [];
	const locations =
		locationsData?.pages.flatMap((page) => page.items ?? []).filter(Boolean) ??
		[];

	return (
		<>
			<PanelLayout className="flex-1 min-h-0">
				<PanelList>
					<div className="p-3 border-b border-border shrink-0 flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								{m.loc_count({ count: locations.length })}
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
								placeholder={m.loc_search_placeholder()}
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
									label={m.loc_filter_tag()}
									count={searchParams.tag_id ? 1 : 0}
									selectedLabel={
										searchParams.tag_id
											? tags.find((t) => t.id === searchParams.tag_id)?.name
											: undefined
									}
									onClear={() =>
										navigate({
											search: (prev) => ({ ...prev, tag_id: undefined }),
											replace: true,
										})
									}
								/>
								<PopoverContent align="start" className="w-48 p-0 gap-0">
									<MultiFilterSection
										label={m.loc_filter_tag()}
										options={tags.map((t) => t.name)}
										values={
											searchParams.tag_id
												? [
														tags.find((t) => t.id === searchParams.tag_id)
															?.name ?? "",
													]
												: []
										}
										onChange={(v) => {
											const selected = v[v.length - 1];
											const tag = tags.find((t) => t.name === selected);
											navigate({
												search: (prev) => ({
													...prev,
													tag_id: tag?.id,
												}),
												replace: true,
											});
										}}
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<VirtualPanelList
						items={locations}
						isLoading={isLoading}
						hasNextPage={hasNextPage ?? false}
						isFetchingNextPage={isFetchingNextPage}
						fetchNextPage={fetchNextPage}
						getItemKey={(location) => location.id}
						estimateSize={56}
						emptyState={
							<div className="flex items-center justify-center h-full p-6">
								<div className="text-center text-muted-foreground">
									<MapPinIcon
										className="size-8 mx-auto mb-2 opacity-50"
										weight="duotone"
									/>
									<p className="text-sm">{m.loc_empty_title()}</p>
								</div>
							</div>
						}
						renderItem={(location) => (
							<LocationListItem
								location={location}
								isSelected={selectedLocationId === location.id}
								onClick={() => setSelectedLocationId(location.id)}
							/>
						)}
					/>
				</PanelList>

				{isCreating ? (
					<LocationCreatePanel
						orgId={orgId}
						onCreated={(id) => {
							setIsCreating(false);
							setSelectedLocationId(id);
						}}
						onCancel={() => setIsCreating(false)}
					/>
				) : selectedLocationId ? (
					<LocationDetailPanel
						key={selectedLocationId}
						locationId={selectedLocationId}
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
						<MapPinIcon
							className="size-12 text-muted-foreground/50"
							weight="duotone"
						/>
						<p className="text-muted-foreground">{m.loc_empty_select()}</p>
					</PanelEmpty>
				)}
			</PanelLayout>
		</>
	);
}
