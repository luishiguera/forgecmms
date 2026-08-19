import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { TagIcon } from "@phosphor-icons/react/dist/csr/Tag";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ResourceNotFound } from "@/components/resource-not-found";
import { MultiFilterSection } from "@/components/shared/multi-filter-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterTrigger } from "@/components/ui/filter-trigger";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	PanelDetail,
	PanelDetailContent,
	PanelDetailSection,
	PanelEmpty,
	PanelLayout,
	PanelList,
	PanelListItem,
	PanelListItemAvatar,
	PanelListItemContent,
	PanelListItemMeta,
	PanelListItemSubtitle,
	PanelListItemTitle,
} from "@/components/ui/panel-layout";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { VirtualPanelList } from "@/components/ui/virtual-panel-list";
import { useDebounce } from "@/hooks/use-debounce";
import {
	procedureQueryOptions,
	proceduresInfiniteQueryOptions,
} from "@/lib/queries/procedures";
import { tagsQueryOptions } from "@/lib/queries/tags";
import * as m from "@/paraglide/messages";
import type { ProcedureResponse } from "@/server/domains/procedures/schema";
import { formatDate } from "@/utils/format-date";

const searchSchema = z.object({
	id: z.number().optional(),
	q: z.string().optional(),
	tag_id: z.number().optional(),
});

export const Route = createFileRoute("/org/$orgId/procedures_/")({
	validateSearch: searchSchema,
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId } = Route.useParams();
	const searchParams = Route.useSearch();
	const selectedId = searchParams.id;
	const navigate = useNavigate({ from: Route.fullPath });

	const search = searchParams.q ?? "";
	const debouncedSearch = useDebounce(search, 300);

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "procedure"));
	const tags = tagsData ?? [];

	const {
		data: proceduresData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		proceduresInfiniteQueryOptions(orgId, {
			size: 20,
			q: debouncedSearch || undefined,
			tag_id: searchParams.tag_id,
		}),
	);

	const procedures =
		proceduresData?.pages.flatMap((page) => page.items ?? []).filter(Boolean) ??
		[];

	const activeFilterCount = searchParams.tag_id ? 1 : 0;

	const handleSelectProcedure = (procedureId: number) => {
		navigate({
			search: (prev) => ({ ...prev, id: procedureId }),
		});
	};

	return (
		<PanelLayout className="flex-1 min-h-0">
			<PanelList>
				<div className="p-3 border-b border-border shrink-0 flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							{m.proc_count({ count: procedures.length })}
						</span>
						<Button
							size="icon-sm"
							nativeButton={false}
							render={
								<Link to="/org/$orgId/procedures/create" params={{ orgId }} />
							}
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
							placeholder={m.proc_search_placeholder()}
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
								icon={TagIcon}
								label={m.proc_filter_tag()}
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
							<PopoverContent align="start" className="w-56 p-0">
								<MultiFilterSection
									label={m.proc_filter_tag()}
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

						{activeFilterCount > 0 && (
							<button
								type="button"
								onClick={() =>
									navigate({
										search: (prev) => ({
											...prev,
											tag_id: undefined,
										}),
										replace: true,
									})
								}
								className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
							>
								<XIcon className="size-3" weight="bold" />
								{m.proc_filter_clear_all()}
							</button>
						)}
					</div>
				</div>

				<VirtualPanelList
					items={procedures}
					isLoading={isLoading}
					hasNextPage={hasNextPage ?? false}
					isFetchingNextPage={isFetchingNextPage}
					fetchNextPage={fetchNextPage}
					getItemKey={(procedure) => procedure.id}
					estimateSize={64}
					loadingState={<ProceduresListSkeleton />}
					emptyState={
						<div className="flex flex-col items-center justify-center py-12 px-4">
							<ListChecksIcon
								className="size-12 text-muted-foreground/50"
								weight="duotone"
							/>
							<p className="mt-2 text-sm text-muted-foreground">
								{m.proc_empty()}
							</p>
						</div>
					}
					renderItem={(procedure) => (
						<ProcedureListItem
							procedure={procedure}
							isSelected={selectedId === procedure.id}
							onClick={() => handleSelectProcedure(procedure.id)}
						/>
					)}
				/>
			</PanelList>

			{selectedId ? (
				<ProcedureDetailPanel
					key={selectedId}
					procedureId={selectedId}
					orgId={orgId}
				/>
			) : (
				<PanelEmpty>
					<ListChecksIcon
						className="size-12 text-muted-foreground/50"
						weight="duotone"
					/>
					<p className="text-muted-foreground">{m.proc_select_to_view()}</p>
				</PanelEmpty>
			)}
		</PanelLayout>
	);
}

function ProcedureListItem({
	procedure,
	isSelected,
	onClick,
}: {
	procedure: ProcedureResponse;
	isSelected: boolean;
	onClick: () => void;
}) {
	const fields = Array.isArray(procedure.fields) ? procedure.fields : [];
	const fieldCount = fields.length;

	return (
		<PanelListItem isSelected={isSelected} onClick={onClick}>
			<PanelListItemAvatar>
				<ListChecksIcon className="size-5" weight="duotone" />
			</PanelListItemAvatar>

			<PanelListItemContent>
				<PanelListItemTitle>{procedure.name}</PanelListItemTitle>
				<PanelListItemSubtitle>
					{m.proc_field_count({ count: fieldCount })}
				</PanelListItemSubtitle>
				{procedure.tags?.length > 0 && (
					<div className="flex items-center gap-1 mt-0.5">
						{procedure.tags.slice(0, 2).map((tag) => (
							<Badge key={tag.id}>{tag.name}</Badge>
						))}
						{procedure.tags.length > 2 && (
							<Badge>+{procedure.tags.length - 2}</Badge>
						)}
					</div>
				)}
			</PanelListItemContent>

			<PanelListItemMeta>
				<span className="text-xs text-muted-foreground tabular-nums">
					{m.proc_uses_count({ count: procedure.uses_count })}
				</span>
			</PanelListItemMeta>
		</PanelListItem>
	);
}

function ProcedureDetailPanel({
	procedureId,
	orgId,
}: {
	procedureId: number;
	orgId: string;
}) {
	const {
		data: procedure,
		isLoading,
		isError,
	} = useQuery(procedureQueryOptions(orgId, procedureId));

	if (isLoading) {
		return (
			<PanelDetail>
				<PanelDetailContent>
					<div className="flex items-center justify-center h-full p-6">
						<Spinner className="size-6" />
					</div>
				</PanelDetailContent>
			</PanelDetail>
		);
	}

	if (isError) {
		return (
			<PanelDetail>
				<PanelDetailContent>
					<div className="flex items-center justify-center h-full p-6">
						<ResourceNotFound className="max-w-md" />
					</div>
				</PanelDetailContent>
			</PanelDetail>
		);
	}

	if (!procedure) return null;

	const fields = Array.isArray(procedure.fields) ? procedure.fields : [];
	const fieldCount = fields.length;

	return (
		<PanelDetail>
			<PanelDetailContent>
				<PanelDetailSection
					title={m.proc_detail_basic_info()}
					action={
						<Button
							nativeButton={false}
							size="sm"
							render={
								<Link
									to="/org/$orgId/procedures/$procedureId"
									params={{ orgId, procedureId: String(procedure.id) }}
								/>
							}
						>
							{m.proc_detail_edit()}
						</Button>
					}
				>
					<div className="space-y-4">
						<div>
							<div className="text-xs text-muted-foreground mb-1">
								{m.proc_detail_name()}
							</div>
							<div className="text-sm font-medium">{procedure.name}</div>
						</div>
						{procedure.description && (
							<div>
								<div className="text-xs text-muted-foreground mb-1">
									{m.proc_detail_description()}
								</div>
								<div className="text-sm text-muted-foreground">
									{procedure.description}
								</div>
							</div>
						)}
					</div>
				</PanelDetailSection>

				{procedure.tags.length > 0 && (
					<PanelDetailSection title={m.proc_detail_tags()}>
						<div className="flex flex-wrap gap-1.5">
							{procedure.tags.map((tag) => (
								<Badge key={tag.id}>{tag.name}</Badge>
							))}
						</div>
					</PanelDetailSection>
				)}

				<PanelDetailSection title={m.proc_detail_statistics()}>
					<div className="space-y-4">
						<div>
							<div className="text-xs text-muted-foreground mb-1">
								{m.proc_detail_total_fields()}
							</div>
							<div className="text-sm font-medium">{fieldCount}</div>
						</div>
						<div>
							<div className="text-xs text-muted-foreground mb-1">
								{m.proc_detail_times_used()}
							</div>
							<div className="text-sm font-medium">{procedure.uses_count}</div>
						</div>
						<div>
							<div className="text-xs text-muted-foreground mb-1">
								{m.proc_detail_created()}
							</div>
							<div className="text-sm font-medium">
								{formatDate(procedure.created_at)}
							</div>
						</div>
						<div>
							<div className="text-xs text-muted-foreground mb-1">
								{m.proc_detail_last_updated()}
							</div>
							<div className="text-sm font-medium">
								{formatDate(procedure.updated_at)}
							</div>
						</div>
					</div>
				</PanelDetailSection>
			</PanelDetailContent>
		</PanelDetail>
	);
}

function ProceduresListSkeleton() {
	return (
		<div className="flex flex-col">
			{Array.from({ length: 6 }).map((_, i) => (
				<div
					key={i}
					className="flex items-center gap-3 px-4 py-3 border-b border-border"
				>
					<Skeleton className="size-10 rounded-lg shrink-0" />
					<div className="flex-1 min-w-0 space-y-1.5">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-3 w-32" />
					</div>
					<Skeleton className="h-4 w-16" />
				</div>
			))}
		</div>
	);
}
