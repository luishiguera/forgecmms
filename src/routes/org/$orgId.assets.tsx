import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { GearIcon } from "@phosphor-icons/react/dist/csr/Gear";
import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { TagIcon } from "@phosphor-icons/react/dist/csr/Tag";
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
import { assetsInfiniteQueryOptions } from "@/lib/queries/assets";
import { tagsQueryOptions } from "@/lib/queries/tags";
import * as m from "@/paraglide/messages";
import { AssetListItem } from "./$orgId.assets/-components";
import { AssetCreatePanel } from "./$orgId.assets/-create-panel";
import { AssetDetailPanel } from "./$orgId.assets/-detail-panel";
import { getStatusOptions } from "./$orgId.assets/-types";

const searchSchema = z.object({
	id: z.number().optional(),
	q: z.string().optional(),
	status: z
		.enum(["operational", "needs_maintenance", "retired", "pending"])
		.optional(),
	tag_id: z.number().optional(),
	tab: z.enum(["overview", "related", "attachments"]).optional(),
});

export const Route = createFileRoute("/org/$orgId/assets")({
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
	const selectedAssetId = searchParams.id ?? null;
	const setSelectedAssetId = (id: number | null) => {
		setIsCreating(false);
		navigate({
			search: (prev) => ({ ...prev, id: id ?? undefined }),
			replace: true,
		});
	};
	const statusOptions = getStatusOptions();
	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "asset"));

	const {
		data: assetsData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		assetsInfiniteQueryOptions(orgId, {
			size: 20,
			q: debouncedSearch || undefined,
			tag_id: searchParams.tag_id,
			status: searchParams.status,
		}),
	);

	const tags = tagsData ?? [];
	const assets =
		assetsData?.pages.flatMap((page) => page.items ?? []).filter(Boolean) ?? [];

	return (
		<>
			<PanelLayout className="flex-1 min-h-0">
				<PanelList>
					<div className="p-3 border-b border-border shrink-0 flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								{m.assets_count({ count: assets.length })}
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
								placeholder={m.assets_search_placeholder()}
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
									icon={GearIcon}
									label={m.assets_filter_status()}
									count={searchParams.status ? 1 : 0}
									selectedLabel={
										searchParams.status
											? statusOptions.find(
													(s) => s.value === searchParams.status,
												)?.label
											: undefined
									}
									onClear={() =>
										navigate({
											search: (prev) => ({ ...prev, status: undefined }),
											replace: true,
										})
									}
								/>
								<PopoverContent align="start" className="w-48 p-1 gap-0">
									{statusOptions.map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() =>
												navigate({
													search: (prev) => ({
														...prev,
														status: option.value,
													}),
													replace: true,
												})
											}
											className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
										>
											<CheckIcon
												className={`size-3.5 ${searchParams.status === option.value ? "opacity-100" : "opacity-0"}`}
												weight="bold"
											/>
											{option.label}
										</button>
									))}
								</PopoverContent>
							</Popover>
							<Popover>
								<FilterTrigger
									icon={TagIcon}
									label={m.assets_filter_tag()}
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
										label={m.assets_filter_tag()}
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
						items={assets}
						isLoading={isLoading}
						hasNextPage={hasNextPage ?? false}
						isFetchingNextPage={isFetchingNextPage}
						fetchNextPage={fetchNextPage}
						getItemKey={(asset) => asset.id}
						estimateSize={64}
						emptyState={
							<div className="flex items-center justify-center h-full p-6">
								<div className="text-center text-muted-foreground">
									<HardDriveIcon
										className="size-8 mx-auto mb-2 opacity-50"
										weight="duotone"
									/>
									<p className="text-sm">{m.assets_empty_title()}</p>
								</div>
							</div>
						}
						renderItem={(asset) => (
							<AssetListItem
								asset={asset}
								isSelected={selectedAssetId === asset.id}
								onClick={() => setSelectedAssetId(asset.id)}
							/>
						)}
					/>
				</PanelList>

				{isCreating ? (
					<AssetCreatePanel
						orgId={orgId}
						onCreated={(id) => {
							setIsCreating(false);
							setSelectedAssetId(id);
						}}
						onCancel={() => setIsCreating(false)}
					/>
				) : selectedAssetId ? (
					<AssetDetailPanel
						key={selectedAssetId}
						assetId={selectedAssetId}
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
						orgId={orgId}
					/>
				) : (
					<PanelEmpty>
						<HardDriveIcon
							className="size-12 text-muted-foreground/50"
							weight="duotone"
						/>
						<p className="text-muted-foreground">{m.assets_empty_select()}</p>
					</PanelEmpty>
				)}
			</PanelLayout>
		</>
	);
}
