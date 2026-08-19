import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
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
import {
	locationQueryOptions,
	useUpdateLocationMutation,
} from "@/lib/queries/locations";
import {
	tagsQueryOptions,
	useCreateTagMutation,
	useSetEntityTagsMutation,
} from "@/lib/queries/tags";
import { useUploadMutation } from "@/lib/queries/upload";
import * as m from "@/paraglide/messages";
import { convertToWebP } from "@/utils/image";
import { buildPartialUpdateRequest, LocationForm } from "./-location-form";
import type { LocationFormValues } from "./-types";

type LocationTab = "overview" | "related" | "attachments";

interface LocationDetailPanelProps {
	locationId: number;
	orgId: string;
	activeTab: LocationTab;
	onTabChange: (tab: LocationTab) => void;
}

export function LocationDetailPanel({
	locationId,
	orgId,
	activeTab,
	onTabChange,
}: LocationDetailPanelProps) {
	const {
		data: location,
		isLoading: isLoadingLocation,
		isError: isLocationError,
	} = useQuery(locationQueryOptions(orgId, locationId));

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "location"));
	const allTags = tagsData ?? [];
	const createTagMutation = useCreateTagMutation(orgId, "location");

	const updateMutation = useUpdateLocationMutation(orgId);
	const setTagsMutation = useSetEntityTagsMutation(
		orgId,
		"locations",
		locationId,
		"location",
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

	const handleAutoSave = async (values: LocationFormValues) => {
		const partialData = buildPartialUpdateRequest(values, modifiedFields);
		if (Object.keys(partialData).length === 0) return;

		await updateMutation.mutateAsync({
			locationId: locationId,
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
			folder: "locations",
		});
		await updateMutation.mutateAsync({
			locationId,
			data: { image_url: result.url },
		});
	};

	const [tagSearch, setTagSearch] = useState("");

	const currentTagIds = location?.tags.map((t) => t.id) ?? [];

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

	if (isLoadingLocation) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	if (isLocationError) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<ResourceNotFound className="max-w-md" />
			</div>
		);
	}

	if (!location) {
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
											src={location.image_url ?? undefined}
											alt={location.name}
										/>
										<AvatarFallback>
											<MapPinIcon
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
								{location.name}
							</h2>
							{location.address && (
								<p className="text-sm text-muted-foreground truncate mt-0.5">
									{location.address}
								</p>
							)}
							<div className="flex flex-wrap items-center gap-1.5 mt-2">
								{location.tags.map((tag) => (
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
											value={location.tags.map((t) => t.name)}
											onValueChange={(value) => {
												const names = value as string[];
												const lastAdded = names[names.length - 1];
												if (lastAdded) {
													handleTagToggle(lastAdded);
												} else {
													const removedName = location.tags
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
					onValueChange={(val) => onTabChange(val as LocationTab)}
				>
					<TabsList variant="line" className="px-6">
						<TabsTrigger value="overview">{m.loc_tab_overview()}</TabsTrigger>
						<TabsTrigger value="related">{m.loc_tab_related()}</TabsTrigger>
						<TabsTrigger value="attachments">
							{m.loc_tab_attachments()}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="flex-1 overflow-y-auto no-scrollbar bg-muted/30">
				<div className="p-6">
					{activeTab === "attachments" ? (
						<AttachmentSections
							orgId={orgId}
							entityType="location"
							entityId={location.id}
						/>
					) : (
						<LocationForm
							mode="edit"
							orgId={orgId}
							activeTab={activeTab}
							location={location}
							locationAssets={location.assets}
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
