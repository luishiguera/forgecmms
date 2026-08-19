import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { ResourceNotFound } from "@/components/resource-not-found";
import { BusinessTypeBadges } from "@/components/shared/business-type-badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { PanelDetailSection } from "@/components/ui/panel-layout";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type FieldStatus, useAutoSave } from "@/hooks/use-auto-save";
import { buildOrgEntityDetailLink } from "@/lib/org-entity-detail-links";
import {
	businessQueryOptions,
	useUpdateBusinessMutation,
} from "@/lib/queries/businesses";
import { useUploadMutation } from "@/lib/queries/upload";
import * as m from "@/paraglide/messages";
import { convertToWebP } from "@/utils/image";
import { BusinessForm, buildPartialUpdateRequest } from "./-business-form";
import type { BusinessFormValues } from "./-types";

type BusinessTab = "overview" | "related";

interface BusinessDetailPanelProps {
	businessId: number;
	orgId: string;
	activeTab: BusinessTab;
	onTabChange: (tab: BusinessTab) => void;
}

export function BusinessDetailPanel({
	businessId,
	orgId,
	activeTab,
	onTabChange,
}: BusinessDetailPanelProps) {
	const {
		data: business,
		isLoading: isLoadingBusiness,
		isError: isBusinessError,
	} = useQuery(businessQueryOptions(orgId, businessId));

	const updateMutation = useUpdateBusinessMutation(orgId);

	const { getFieldStatus, getFieldError, handleFieldChange, modifiedFields } =
		useAutoSave({
			isPending: updateMutation.isPending,
			isSuccess: updateMutation.isSuccess,
			isError: updateMutation.isError,
			error: updateMutation.error,
		});

	const getFieldStatusWithMutations = (fieldName: string): FieldStatus =>
		getFieldStatus(fieldName);

	const handleAutoSave = async (values: BusinessFormValues) => {
		const partialData = buildPartialUpdateRequest(values, modifiedFields);
		if (Object.keys(partialData).length === 0) return;

		await updateMutation.mutateAsync({
			businessId,
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
			folder: "businesses",
		});
		await updateMutation.mutateAsync({
			businessId,
			data: { image_url: result.url },
		});
	};

	if (isLoadingBusiness) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	if (isBusinessError) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<ResourceNotFound className="max-w-md" />
			</div>
		);
	}

	if (!business) {
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
											src={business.image_url ?? undefined}
											alt={business.name}
										/>
										<AvatarFallback>
											<BuildingsIcon
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
								{business.name}
							</h2>
							<div className="flex flex-wrap items-center gap-1.5 mt-2">
								<BusinessTypeBadges type={business.type} />
							</div>
						</div>
					</div>
				</div>

				<Tabs
					value={activeTab}
					onValueChange={(val) => onTabChange(val as BusinessTab)}
				>
					<TabsList variant="line" className="px-6">
						<TabsTrigger value="overview">{m.biz_tab_overview()}</TabsTrigger>
						<TabsTrigger value="related">{m.biz_tab_related()}</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="flex-1 overflow-y-auto no-scrollbar bg-muted/30">
				<div className="p-6">
					{activeTab === "related" ? (
						<PanelDetailSection title={m.biz_section_related()}>
							{business.locations.length > 0 ? (
								<Field>
									<FieldLabel>{m.sidebar_locations()}</FieldLabel>
									<div className="space-y-2">
										{business.locations.map((location) => (
											<Item key={location.id} variant="outline">
												<ItemMedia variant="image">
													{location.image_url ? (
														<img
															src={location.image_url}
															alt=""
															className="size-full object-cover rounded-md"
														/>
													) : (
														<MapPinIcon
															className="w-5 h-5 text-muted-foreground"
															weight="duotone"
														/>
													)}
												</ItemMedia>
												<ItemContent>
													<ItemTitle
														link={buildOrgEntityDetailLink(
															orgId,
															"locations",
															location.id,
														)}
													>
														{location.name}
													</ItemTitle>
													{location.address && (
														<ItemDescription truncate={false}>
															{location.address}
														</ItemDescription>
													)}
												</ItemContent>
											</Item>
										))}
									</div>
								</Field>
							) : (
								<p className="text-sm text-muted-foreground">
									{m.biz_no_locations()}
								</p>
							)}
						</PanelDetailSection>
					) : (
						<BusinessForm
							mode="edit"
							orgId={orgId}
							activeTab={activeTab}
							business={business}
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
