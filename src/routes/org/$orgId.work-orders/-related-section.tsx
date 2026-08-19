import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
	AssigneesSelectField,
	LocationSelectField,
} from "@/components/shared/form-fields";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { PanelDetailSection } from "@/components/ui/panel-layout";
import type { FieldStatus } from "@/hooks/use-auto-save";
import { useDebounce } from "@/hooks/use-debounce";
import { buildOrgEntityDetailLink } from "@/lib/org-entity-detail-links";
import { assetsQueryOptions } from "@/lib/queries/assets";
import * as m from "@/paraglide/messages";
import type { AssetResponse } from "@/server/domains/assets/schema";
import type {
	AssetAssignment,
	WorkOrderAssetItemResponse,
} from "@/server/domains/workorders/schema";
import { WorkOrderAssetRow } from "./-work-order-asset-row";
import { WorkOrderPartsField } from "./-work-order-parts-field";
import { useWorkOrderRelations } from "./-work-order-relations-context";

type WorkOrderFormApi = any;

interface RelatedSectionProps {
	orgId: string;
	form: WorkOrderFormApi;
	combinedAssignees: Array<{
		id: number;
		full_name: string;
		email: string;
		photo_url?: string | null;
	}>;
	onAssigneesSearch: (value: string) => void;
	isAssigneesSearching: boolean;
	combinedLocations: Array<{
		id: number;
		name: string;
		address?: string | null;
		image_url?: string | null;
		business?: {
			name?: string;
			phones?: Array<{ number?: string }>;
		} | null;
	}>;
	onLocationSearch: (value: string) => void;
	isLocationSearching: boolean;
	getCoreFieldStatus?: (fieldName: string) => FieldStatus | undefined;
	onFieldChange?: (fieldName: string) => void;
}

export function RelatedSection({
	orgId,
	form,
	combinedAssignees,
	onAssigneesSearch,
	isAssigneesSearching,
	combinedLocations,
	onLocationSearch,
	isLocationSearching,
	getCoreFieldStatus,
	onFieldChange,
}: RelatedSectionProps) {
	const relations = useWorkOrderRelations();

	const [assetSearchQuery, setAssetSearchQuery] = useState("");
	const debouncedAssetSearchQuery = useDebounce(assetSearchQuery, 300);

	const { data: assetsData, isFetching: isAssetSearching } = useQuery(
		assetsQueryOptions(orgId, {
			page: 1,
			size: 50,
			q: debouncedAssetSearchQuery || undefined,
		}),
	);

	const knownAssetsRef = useRef(new Map<number, WorkOrderAssetItemResponse>());
	for (const a of relations.assets.seed) {
		knownAssetsRef.current.set(a.id, a);
	}

	return (
		<PanelDetailSection title={m.wo_section_related()}>
			<div className="space-y-6">
				<LocationSelectField
					form={form}
					name="location_id"
					label="Location"
					locations={combinedLocations}
					onSearch={onLocationSearch}
					isSearching={isLocationSearching}
					onFieldChange={onFieldChange}
					status={getCoreFieldStatus?.("location_id")}
					getItemDetailLink={(id) =>
						buildOrgEntityDetailLink(orgId, "locations", id)
					}
				/>

				<AssigneesSelectField
					form={form}
					name="assignee_ids"
					assignees={combinedAssignees}
					onSearch={onAssigneesSearch}
					isSearching={isAssigneesSearching}
					onAddAssignee={relations.assignees.onAdd}
					onRemoveAssignee={relations.assignees.onRemove}
					status={relations.status.assignees}
				/>

				<form.Field name="asset_assignments">
					{(assetField: {
						state: { value: AssetAssignment[] };
						handleChange: (v: AssetAssignment[]) => void;
					}) => {
						const allWorkOrderAssetIds = new Set(
							assetField.state.value.map((a) => a.asset_id),
						);

						const allAssets = assetField.state.value
							.map((a) => knownAssetsRef.current.get(a.asset_id))
							.filter((a): a is WorkOrderAssetItemResponse => a != null);

						const availableAssets = (assetsData?.items ?? []).filter(
							(a) => !allWorkOrderAssetIds.has(a.id),
						);

						const handleAddAsset = (asset: AssetResponse) => {
							knownAssetsRef.current.set(asset.id, {
								id: asset.id,
								name: asset.name,
								image_url: asset.image_url,
								serial_number: asset.serial_number,
								criticality: asset.criticality,
								assignment_status: asset.assignment_status,
								status: asset.status,
								location_id: asset.location_id,
								procedures: [],
							});
							assetField.handleChange([
								...assetField.state.value,
								{ asset_id: asset.id },
							]);
							relations.assets.onAdd?.(asset.id);
						};

						const handleRemoveAsset = (assetId: number) => {
							assetField.handleChange(
								assetField.state.value.filter((a) => a.asset_id !== assetId),
							);
							relations.assets.onRemove?.(assetId);
						};

						const handleAddAssetProcedure = (
							assetId: number,
							procedureId: number,
						) => {
							assetField.handleChange(
								assetField.state.value.map((a) =>
									a.asset_id === assetId
										? {
												...a,
												procedure_ids: [
													...(a.procedure_ids ?? []),
													procedureId,
												],
											}
										: a,
								),
							);
							relations.assets.onAddProcedure?.(assetId, procedureId);
						};

						const handleRemoveAssetProcedure = (
							assetId: number,
							procedureId: number,
						) => {
							assetField.handleChange(
								assetField.state.value.map((a) =>
									a.asset_id === assetId
										? {
												...a,
												procedure_ids: (a.procedure_ids ?? []).filter(
													(id) => id !== procedureId,
												),
											}
										: a,
								),
							);
							relations.assets.onRemoveProcedure?.(assetId, procedureId);
						};

						return (
							<Field>
								<FieldLabel className="flex items-center gap-1.5">
									{m.wo_field_assets()}
									{relations.status.assets !== "idle" && (
										<FieldStatusIndicator status={relations.status.assets} />
									)}
								</FieldLabel>
								<Combobox
									value={null}
									onValueChange={(value) => {
										const asset = availableAssets.find(
											(a) => a.id === Number(value),
										);
										if (asset) handleAddAsset(asset);
									}}
									items={availableAssets.map((a) => a.id.toString())}
									filter={null}
								>
									<ComboboxInput
										placeholder={m.shared_field_search_assets()}
										onInput={(e) => setAssetSearchQuery(e.currentTarget.value)}
									/>
									<ComboboxContent>
										<ComboboxList>
											{(item) => {
												const a = availableAssets.find(
													(asset) => asset.id === Number(item),
												);
												if (!a) return null;
												return (
													<ComboboxItem
														key={item}
														value={item}
														className="flex items-center gap-2 py-1.5"
													>
														<div className="shrink-0 size-6 rounded bg-muted flex items-center justify-center overflow-hidden">
															{a.image_url ? (
																<img
																	src={a.image_url}
																	alt=""
																	className="w-full h-full object-cover"
																/>
															) : (
																<HardDriveIcon className="size-3 text-muted-foreground" />
															)}
														</div>
														<div className="flex-1 min-w-0">
															<div className="text-sm font-medium truncate">
																{a.name}
															</div>
															{a.serial_number && (
																<div className="text-xs text-muted-foreground truncate">
																	{a.serial_number}
																</div>
															)}
														</div>
													</ComboboxItem>
												);
											}}
										</ComboboxList>
										<ComboboxEmpty>
											{isAssetSearching
												? m.shared_searching()
												: m.shared_no_assets_found()}
										</ComboboxEmpty>
									</ComboboxContent>
								</Combobox>
								{allAssets.length > 0 && (
									<div className="space-y-2 mt-2">
										{allAssets.map((asset) => (
											<WorkOrderAssetRow
												key={asset.id}
												asset={asset}
												orgId={orgId}
												onRemove={() => handleRemoveAsset(asset.id)}
												onAddProcedure={(procedureId) =>
													handleAddAssetProcedure(asset.id, procedureId)
												}
												onRemoveProcedure={(procedureId) =>
													handleRemoveAssetProcedure(asset.id, procedureId)
												}
											/>
										))}
									</div>
								)}
							</Field>
						);
					}}
				</form.Field>

				<WorkOrderPartsField
					orgId={orgId}
					existingParts={relations.parts.items}
					onAddPart={relations.parts.onAdd}
					onRemovePart={relations.parts.onRemove}
					onChangePlanned={relations.parts.onChangePlanned}
					onChangeUsed={relations.parts.onChangeUsed}
					status={relations.status.parts}
				/>
			</div>
		</PanelDetailSection>
	);
}
