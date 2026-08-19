import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ResourceNotFound } from "@/components/resource-not-found";
import { AttachmentSections } from "@/components/shared/attachment-sections";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAutoSave } from "@/hooks/use-auto-save";
import {
	tagsQueryOptions,
	useCreateTagMutation,
	useSetEntityTagsMutation,
} from "@/lib/queries/tags";
import {
	useUpdateWorkOrderMutation,
	workOrderQueryOptions,
} from "@/lib/queries/work-orders";
import * as m from "@/paraglide/messages";
import { WorkOrderExecution } from "./-execution";
import { buildPartialUpdateRequest } from "./-mappers";
import type { WorkOrderFormValues } from "./-types";
import { WorkOrderEditForm } from "./-work-order-edit-form";

type WorkOrderTab = "overview" | "execution" | "related" | "attachments";

interface WorkOrderDetailPanelProps {
	workOrderId: number;
	orgId: string;
	activeTab: WorkOrderTab;
	onTabChange: (tab: WorkOrderTab) => void;
}

export function WorkOrderDetailPanel({
	workOrderId,
	orgId,
	activeTab,
	onTabChange,
}: WorkOrderDetailPanelProps) {
	const {
		data: workOrder,
		isLoading,
		isError: isWorkOrderError,
	} = useQuery(workOrderQueryOptions(orgId, workOrderId));

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "work_order"));
	const allTags = tagsData ?? [];
	const createTagMutation = useCreateTagMutation(orgId, "work_order");

	const updateMutation = useUpdateWorkOrderMutation(orgId);
	const setTagsMutation = useSetEntityTagsMutation(
		orgId,
		"work-orders",
		workOrderId,
		"work_order",
	);
	const { getFieldStatus, getFieldError, handleFieldChange, modifiedFields } =
		useAutoSave({
			isPending: updateMutation.isPending,
			isSuccess: updateMutation.isSuccess,
			isError: updateMutation.isError,
			error: updateMutation.error,
		});

	const handleAutoSave = async (values: WorkOrderFormValues) => {
		const partialData = buildPartialUpdateRequest(values, modifiedFields);
		if (Object.keys(partialData).length === 0) return;

		await updateMutation.mutateAsync({
			workOrderId: workOrderId,
			data: partialData,
		});
	};

	const [tagSearch, setTagSearch] = useState("");

	const currentTagIds = workOrder?.tags?.map((t) => t.id) ?? [];

	const handleTagToggle = (tagName: string) => {
		const tag = allTags.find((t) => t.name === tagName);
		if (!tag) return;
		const isSelected = currentTagIds.includes(tag.id);
		const newIds = isSelected
			? currentTagIds.filter((id) => id !== tag.id)
			: [...currentTagIds, tag.id];
		setTagsMutation.mutate(newIds);
	};

	const handleTagRemove = (tagId: number) => {
		setTagsMutation.mutate(currentTagIds.filter((id) => id !== tagId));
	};

	const handleTagCreate = async (name: string) => {
		const result = await createTagMutation.mutateAsync({ name });
		setTagsMutation.mutate([...currentTagIds, result.id]);
		setTagSearch("");
	};

	if (isLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	if (isWorkOrderError) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<ResourceNotFound className="max-w-md" />
			</div>
		);
	}

	if (!workOrder) {
		return null;
	}

	return (
		<div className="flex flex-1 flex-col min-w-0 overflow-hidden">
			<div className="shrink-0 border-b bg-card">
				<div className="px-6 pt-5 pb-4">
					<div className="flex items-start gap-4">
						{workOrder.location && (
							<Avatar className="size-14">
								<AvatarImage
									src={workOrder.location.image_url ?? undefined}
									alt={workOrder.location.name ?? ""}
								/>
								<AvatarFallback>
									<MapPinIcon
										className="size-5 text-muted-foreground"
										weight="duotone"
									/>
								</AvatarFallback>
							</Avatar>
						)}
						<div className="flex-1 min-w-0">
							<h2 className="text-base font-semibold truncate leading-tight">
								{workOrder.title}
							</h2>
							{workOrder.location?.address && (
								<p className="text-sm text-muted-foreground truncate mt-0.5">
									{workOrder.location.address}
								</p>
							)}
							<div className="flex flex-wrap items-center gap-1.5 mt-2">
								{(workOrder.tags ?? []).map((tag) => (
									<Badge
										key={tag.id}
										className="cursor-pointer"
										onClick={() => handleTagRemove(tag.id)}
									>
										{tag.name}
										<XIcon className="size-2.5 ml-0.5 opacity-60" />
									</Badge>
								))}
								<Popover>
									<PopoverTrigger
										nativeButton={false}
										render={
											<Badge
												variant="outline"
												className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
											/>
										}
									>
										<PlusIcon className="size-3" weight="bold" />
									</PopoverTrigger>
									<PopoverContent align="start" className="w-56 p-0 gap-0">
										<Combobox
											value={(workOrder.tags ?? []).map((t) => t.name)}
											onValueChange={(value) => {
												const names = value as string[];
												const lastAdded = names[names.length - 1];
												if (lastAdded) {
													handleTagToggle(lastAdded);
												} else {
													const removedName = (workOrder.tags ?? [])
														.map((t) => t.name)
														.find((n) => !names.includes(n));
													if (removedName) handleTagToggle(removedName);
												}
											}}
											multiple
											items={allTags.map((t) => t.name)}
										>
											<ComboboxInput
												placeholder={m.shared_field_search_tags()}
												onInput={(e) => setTagSearch(e.currentTarget.value)}
											/>
											<ComboboxContent>
												<ComboboxList>
													{(item) => (
														<ComboboxItem key={item} value={item}>
															{item}
														</ComboboxItem>
													)}
												</ComboboxList>
												<ComboboxEmpty>
													{tagSearch.trim() ? (
														<button
															type="button"
															className="w-full text-center text-xs text-primary hover:underline cursor-pointer"
															onMouseDown={async (e) => {
																e.preventDefault();
																await handleTagCreate(tagSearch.trim());
															}}
														>
															{m.shared_field_create_tag({
																name: tagSearch.trim(),
															})}
														</button>
													) : (
														<span>{m.shared_no_tags_found()}</span>
													)}
												</ComboboxEmpty>
											</ComboboxContent>
										</Combobox>
									</PopoverContent>
								</Popover>
							</div>
						</div>
					</div>
				</div>

				<Tabs
					value={activeTab}
					onValueChange={(val) => onTabChange(val as WorkOrderTab)}
				>
					<TabsList variant="line" className="px-6">
						<TabsTrigger value="overview">{m.wo_tab_overview()}</TabsTrigger>
						<TabsTrigger value="related">{m.wo_tab_related()}</TabsTrigger>
						<TabsTrigger value="attachments">
							{m.wo_tab_attachments()}
						</TabsTrigger>
						<TabsTrigger value="execution">{m.wo_tab_execution()}</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="flex-1 overflow-y-auto no-scrollbar bg-muted/30">
				<div className="p-6">
					{activeTab === "attachments" ? (
						<AttachmentSections
							orgId={orgId}
							entityType="workorder"
							entityId={workOrder.id}
						/>
					) : activeTab === "execution" ? (
						<WorkOrderExecution workOrder={workOrder} orgId={orgId} />
					) : (
						<WorkOrderEditForm
							orgId={orgId}
							workOrderId={workOrderId}
							activeTab={activeTab}
							workOrder={workOrder}
							onAutoSave={handleAutoSave}
							getFieldStatus={getFieldStatus}
							getFieldError={getFieldError}
							handleFieldChange={handleFieldChange}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
