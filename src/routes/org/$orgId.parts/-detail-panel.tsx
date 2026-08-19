import { CubeIcon } from "@phosphor-icons/react/dist/csr/Cube";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
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
import {
	type FieldStatus,
	getMutationStatus,
	useAutoSave,
} from "@/hooks/use-auto-save";
import { partQueryOptions, useUpdatePartMutation } from "@/lib/queries/parts";
import {
	tagsQueryOptions,
	useCreateTagMutation,
	useSetEntityTagsMutation,
} from "@/lib/queries/tags";
import { useUploadMutation } from "@/lib/queries/upload";
import * as m from "@/paraglide/messages";
import { convertToWebP } from "@/utils/image";
import { buildPartialUpdateRequest, PartForm } from "./-part-form";
import type { PartFormValues } from "./-types";

type PartTab = "overview" | "stock" | "related" | "attachments";

interface PartDetailPanelProps {
	partId: number;
	orgId: string;
	activeTab: PartTab;
	onTabChange: (tab: PartTab) => void;
}

export function PartDetailPanel({
	partId,
	orgId,
	activeTab,
	onTabChange,
}: PartDetailPanelProps) {
	const {
		data: part,
		isLoading: isLoadingPart,
		isError: isPartError,
	} = useQuery(partQueryOptions(orgId, partId));

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "part"));
	const allTags = tagsData ?? [];
	const createTagMutation = useCreateTagMutation(orgId, "part");

	const updateMutation = useUpdatePartMutation(orgId);
	const setTagsMutation = useSetEntityTagsMutation(
		orgId,
		"parts",
		partId,
		"part",
	);

	const { getFieldStatus, getFieldError, handleFieldChange, modifiedFields } =
		useAutoSave({
			isPending: updateMutation.isPending,
			isSuccess: updateMutation.isSuccess,
			isError: updateMutation.isError,
			error: updateMutation.error,
		});

	const getFieldStatusWithMutations = (fieldName: string): FieldStatus => {
		if (fieldName === "tag_ids") return getMutationStatus(setTagsMutation);
		return getFieldStatus(fieldName);
	};

	const handleAutoSave = async (values: PartFormValues) => {
		const partialData = buildPartialUpdateRequest(values, modifiedFields);
		if (Object.keys(partialData).length === 0) return;

		await updateMutation.mutateAsync({
			partId: partId,
			data: partialData,
		});
	};

	const uploadMutation = useUploadMutation();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const webpFile = await convertToWebP(file);
		const result = await uploadMutation.mutateAsync({
			organizationId: orgId,
			file: webpFile,
			folder: "parts",
		});
		await updateMutation.mutateAsync({
			partId,
			data: { image_url: result.url },
		});
	};

	const [tagSearch, setTagSearch] = useState("");

	const currentTagIds = part?.tags.map((t) => t.id) ?? [];

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

	if (isLoadingPart) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	if (isPartError) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<ResourceNotFound className="max-w-md" />
			</div>
		);
	}

	if (!part) {
		return null;
	}

	return (
		<div className="flex flex-1 flex-col min-w-0 overflow-hidden">
			<div className="shrink-0 border-b bg-card">
				<div className="px-6 pt-5 pb-4">
					<div className="flex items-start gap-4">
						<button
							type="button"
							className="cursor-pointer"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploadMutation.isPending}
						>
							<Avatar className="size-14">
								{uploadMutation.isPending ? (
									<AvatarFallback>
										<Spinner className="size-4" />
									</AvatarFallback>
								) : (
									<>
										<AvatarImage
											src={part.image_url ?? undefined}
											alt={part.name}
										/>
										<AvatarFallback>
											<CubeIcon
												className="size-5 text-muted-foreground"
												weight="duotone"
											/>
										</AvatarFallback>
									</>
								)}
							</Avatar>
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleImageUpload}
						/>
						<div className="flex-1 min-w-0">
							<h2 className="text-base font-semibold truncate leading-tight">
								{part.name}
							</h2>
							{part.sku && (
								<p className="text-sm text-muted-foreground truncate mt-0.5">
									{part.sku}
								</p>
							)}
							<div className="flex flex-wrap items-center gap-1.5 mt-2">
								{part.tags.map((tag) => (
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
											value={part.tags.map((t) => t.name)}
											onValueChange={(value) => {
												const names = value as string[];
												const lastAdded = names[names.length - 1];
												if (lastAdded) {
													handleTagToggle(lastAdded);
												} else {
													const removedName = part.tags
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
					onValueChange={(val) => onTabChange(val as PartTab)}
				>
					<TabsList variant="line" className="px-6">
						<TabsTrigger value="overview">{m.parts_tab_overview()}</TabsTrigger>
						<TabsTrigger value="stock">{m.parts_tab_stock()}</TabsTrigger>
						<TabsTrigger value="related">{m.parts_tab_related()}</TabsTrigger>
						<TabsTrigger value="attachments">
							{m.parts_tab_attachments()}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="flex-1 overflow-y-auto no-scrollbar bg-muted/30">
				<div className="p-6">
					{activeTab === "attachments" ? (
						<AttachmentSections
							orgId={orgId}
							entityType="part"
							entityId={part.id}
						/>
					) : (
						<PartForm
							mode="edit"
							orgId={orgId}
							activeTab={activeTab}
							part={part}
							onAutoSave={handleAutoSave}
							getFieldStatus={getFieldStatusWithMutations}
							getFieldError={getFieldError}
							handleFieldChange={handleFieldChange}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
