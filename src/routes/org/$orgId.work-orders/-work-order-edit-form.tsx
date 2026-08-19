import { ProhibitIcon } from "@phosphor-icons/react/dist/csr/Prohibit";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FieldStatus } from "@/hooks/use-auto-save";
import { useDebounce } from "@/hooks/use-debounce";
import { locationsQueryOptions } from "@/lib/queries/locations";
import { membersQueryOptions } from "@/lib/queries/members";
import { mergeById } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";
import { formatDate } from "@/utils/format-date";
import { ProcedureSelectField } from "./-form-fields";
import { RelatedSection } from "./-related-section";
import type { WorkOrderFormValues } from "./-types";
import { useEditWorkOrderRelations } from "./-use-edit-work-order-relations";
import { useWorkOrderForm } from "./-use-work-order-form";
import { WorkOrderRelationsProvider } from "./-work-order-relations-context";
import {
	WorkOrderBasicSection,
	WorkOrderSchedulingSection,
} from "./-work-order-sections";

interface WorkOrderEditFormProps {
	orgId: string;
	workOrderId: number;
	activeTab: string;
	workOrder: WorkOrderResponse;
	onAutoSave: (values: WorkOrderFormValues) => Promise<void>;
	getFieldStatus: (fieldName: string) => FieldStatus;
	getFieldError: (fieldName: string) => string | undefined;
	handleFieldChange: (fieldName: string) => void;
}

export function WorkOrderEditForm({
	orgId,
	workOrderId,
	activeTab,
	workOrder,
	onAutoSave,
	getFieldStatus,
	getFieldError,
	handleFieldChange,
}: WorkOrderEditFormProps) {
	const form = useWorkOrderForm({ mode: "edit", workOrder, onAutoSave });
	const relations = useEditWorkOrderRelations({
		orgId,
		workOrderId,
		workOrder,
	});

	const tab = activeTab ?? "overview";

	const [assigneesSearchQuery, setAssigneesSearchQuery] = useState("");
	const debouncedAssigneesSearchQuery = useDebounce(assigneesSearchQuery, 300);
	const { data: membersData, isFetching: isAssigneesSearching } = useQuery({
		...membersQueryOptions(orgId, {
			q: debouncedAssigneesSearchQuery || undefined,
		}),
		enabled: tab === "related",
	});
	const searchAssignees = (membersData?.items ?? [])
		.filter((mem) => mem.accesses?.includes("field"))
		.map((mem) => ({
			id: mem.user_id,
			full_name: mem.full_name,
			email: mem.email,
			photo_url: mem.photo_url,
		}));
	const existingAssignees = (workOrder.assignees ?? [])
		.filter((a) => a.id != null)
		.map((a) => ({
			id: a.id as number,
			full_name: a.full_name ?? "",
			email: a.email ?? "",
			photo_url: a.photo_url,
		}));
	const combinedAssignees = mergeById(existingAssignees, searchAssignees);

	const [locationSearch, setLocationSearch] = useState("");
	const debouncedLocationSearch = useDebounce(locationSearch, 300);
	const { data: locationsData, isFetching: isLocationSearching } = useQuery({
		...locationsQueryOptions(orgId, {
			page: 1,
			size: 20,
			q: debouncedLocationSearch || undefined,
		}),
		enabled: tab === "related",
	});
	const existingLocation = workOrder.location;
	const existingLocations = existingLocation?.id
		? [
				{
					id: existingLocation.id,
					name: existingLocation.name ?? "",
					address: existingLocation.address,
					image_url: existingLocation.image_url,
					business: existingLocation.business,
				},
			]
		: [];
	const combinedLocations = mergeById(
		existingLocations,
		locationsData?.items ?? [],
	);

	return (
		<WorkOrderRelationsProvider value={relations}>
			{tab === "overview" && (
				<div className="space-y-8">
					<WorkOrderBasicSection
						form={form}
						onFieldChange={handleFieldChange}
						getStatus={getFieldStatus}
						getFieldError={getFieldError}
						titlePlaceholder={m.wo_placeholder_title()}
					>
						{workOrder.status === "cancelled" &&
							workOrder.cancellation_reason && (
								<Alert variant="destructive">
									<ProhibitIcon weight="duotone" />
									<AlertTitle>{m.wo_cancellation_reason()}</AlertTitle>
									<AlertDescription>
										{workOrder.cancellation_reason}
										{workOrder.closed_at &&
											` — ${formatDate(workOrder.closed_at, { style: "medium", includeTime: true })}`}
									</AlertDescription>
								</Alert>
							)}

						<ProcedureSelectField
							form={form}
							orgId={orgId}
							onFieldChange={handleFieldChange}
							status={relations.status.procedures}
							onAddProcedure={relations.procedures.onAdd}
							onRemoveProcedure={relations.procedures.onRemove}
						/>
					</WorkOrderBasicSection>

					<WorkOrderSchedulingSection
						form={form}
						onFieldChange={handleFieldChange}
						getStatus={getFieldStatus}
					/>
				</div>
			)}

			{tab === "related" && (
				<div className="space-y-8">
					<RelatedSection
						orgId={orgId}
						form={form}
						combinedAssignees={combinedAssignees}
						onAssigneesSearch={setAssigneesSearchQuery}
						isAssigneesSearching={isAssigneesSearching}
						combinedLocations={combinedLocations}
						onLocationSearch={setLocationSearch}
						isLocationSearching={isLocationSearching}
						getCoreFieldStatus={getFieldStatus}
						onFieldChange={handleFieldChange}
					/>
				</div>
			)}
		</WorkOrderRelationsProvider>
	);
}
