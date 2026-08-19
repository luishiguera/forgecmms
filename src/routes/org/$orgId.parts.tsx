import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { CubeIcon } from "@phosphor-icons/react/dist/csr/Cube";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { PackageIcon } from "@phosphor-icons/react/dist/csr/Package";
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
import { partsInfiniteQueryOptions } from "@/lib/queries/parts";
import { tagsQueryOptions } from "@/lib/queries/tags";
import * as m from "@/paraglide/messages";
import { PartListItem } from "./$orgId.parts/-components";
import { PartCreatePanel } from "./$orgId.parts/-create-panel";
import { PartDetailPanel } from "./$orgId.parts/-detail-panel";

const searchSchema = z.object({
	id: z.number().optional(),
	q: z.string().optional(),
	stock: z.enum(["low", "ok"]).optional(),
	tag_id: z.number().optional(),
	tab: z.enum(["overview", "stock", "related", "attachments"]).optional(),
});

export const Route = createFileRoute("/org/$orgId/parts")({
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
	const selectedPartId = searchParams.id ?? null;
	const setSelectedPartId = (id: number | null) => {
		setIsCreating(false);
		navigate({
			search: (prev) => ({ ...prev, id: id ?? undefined }),
			replace: true,
		});
	};

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "part"));

	const {
		data: partsData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		partsInfiniteQueryOptions(orgId, {
			size: 20,
			q: debouncedSearch || undefined,
			tag_id: searchParams.tag_id,
			stock: searchParams.stock,
		}),
	);

	const tags = tagsData ?? [];
	const parts =
		partsData?.pages.flatMap((page) => page.items ?? []).filter(Boolean) ?? [];

	return (
		<>
			<PanelLayout className="flex-1 min-h-0">
				<PanelList>
					<div className="p-3 border-b border-border shrink-0 flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								{m.parts_count({ count: parts.length })}
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
								placeholder={m.parts_search_placeholder()}
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
									icon={PackageIcon}
									label={m.parts_filter_stock()}
									count={searchParams.stock ? 1 : 0}
									selectedLabel={
										searchParams.stock === "low"
											? m.parts_filter_stock_low()
											: m.parts_filter_stock_ok()
									}
									onClear={() =>
										navigate({
											search: (prev) => ({ ...prev, stock: undefined }),
										})
									}
								/>
								<PopoverContent align="start" className="w-40 p-1 gap-0">
									{[
										{
											value: "all" as const,
											label: m.parts_filter_stock_all(),
										},
										{
											value: "low" as const,
											label: m.parts_filter_stock_low(),
										},
										{ value: "ok" as const, label: m.parts_filter_stock_ok() },
									].map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() =>
												navigate({
													search: (prev) => ({
														...prev,
														stock:
															option.value === "all" ? undefined : option.value,
													}),
												})
											}
											className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
										>
											<CheckIcon
												className={`size-3.5 ${(searchParams.stock ?? "all") === option.value ? "opacity-100" : "opacity-0"}`}
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
									label={m.parts_filter_tag()}
									count={searchParams.tag_id ? 1 : 0}
									selectedLabel={
										searchParams.tag_id
											? tags.find((t) => t.id === searchParams.tag_id)?.name
											: undefined
									}
									onClear={() =>
										navigate({
											search: (prev) => ({ ...prev, tag_id: undefined }),
										})
									}
								/>
								<PopoverContent align="start" className="w-48 p-0 gap-0">
									<MultiFilterSection
										label={m.parts_filter_tag()}
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
													tag_id: tag?.id ?? undefined,
												}),
											});
										}}
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<VirtualPanelList
						items={parts}
						isLoading={isLoading}
						hasNextPage={hasNextPage ?? false}
						isFetchingNextPage={isFetchingNextPage}
						fetchNextPage={fetchNextPage}
						getItemKey={(part) => part.id}
						estimateSize={64}
						emptyState={
							<div className="flex items-center justify-center h-full p-6">
								<div className="text-center text-muted-foreground">
									<CubeIcon
										className="size-8 mx-auto mb-2 opacity-50"
										weight="duotone"
									/>
									<p className="text-sm">{m.parts_empty_title()}</p>
								</div>
							</div>
						}
						renderItem={(part) => (
							<PartListItem
								part={part}
								isSelected={selectedPartId === part.id}
								onClick={() => setSelectedPartId(part.id)}
							/>
						)}
					/>
				</PanelList>

				{isCreating ? (
					<PartCreatePanel
						orgId={orgId}
						onCreated={(id) => {
							setIsCreating(false);
							setSelectedPartId(id);
						}}
						onCancel={() => setIsCreating(false)}
					/>
				) : selectedPartId ? (
					<PartDetailPanel
						key={selectedPartId}
						partId={selectedPartId}
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
						<CubeIcon
							className="size-12 text-muted-foreground/50"
							weight="duotone"
						/>
						<p className="text-muted-foreground">{m.parts_empty_select()}</p>
					</PanelEmpty>
				)}
			</PanelLayout>
		</>
	);
}
