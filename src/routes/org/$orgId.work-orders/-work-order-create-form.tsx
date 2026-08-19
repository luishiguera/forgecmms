import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TagsField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { locationsQueryOptions } from "@/lib/queries/locations";
import { membersQueryOptions } from "@/lib/queries/members";
import { tagsQueryOptions, useCreateTagMutation } from "@/lib/queries/tags";
import * as m from "@/paraglide/messages";
import { ProcedureSelectField } from "./-form-fields";
import { RelatedSection } from "./-related-section";
import type { WorkOrderFormValues } from "./-types";
import { useCreateWorkOrderRelations } from "./-use-create-work-order-relations";
import { useWorkOrderForm } from "./-use-work-order-form";
import { WorkOrderRelationsProvider } from "./-work-order-relations-context";
import {
	WorkOrderBasicSection,
	WorkOrderSchedulingSection,
} from "./-work-order-sections";

interface WorkOrderCreateFormProps {
	orgId: string;
	onSubmit: (values: WorkOrderFormValues) => Promise<void>;
	onCancel: () => void;
	isSubmitting: boolean;
}

export function WorkOrderCreateForm({
	orgId,
	onSubmit,
	onCancel,
	isSubmitting,
}: WorkOrderCreateFormProps) {
	const form = useWorkOrderForm({ mode: "create", onSubmit });
	const relations = useCreateWorkOrderRelations(form);

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "work_order"));
	const createTagMutation = useCreateTagMutation(orgId, "work_order");
	const allTags = tagsData ?? [];

	const [assigneesSearchQuery, setAssigneesSearchQuery] = useState("");
	const debouncedAssigneesSearchQuery = useDebounce(assigneesSearchQuery, 300);
	const { data: membersData, isFetching: isAssigneesSearching } = useQuery(
		membersQueryOptions(orgId, {
			q: debouncedAssigneesSearchQuery || undefined,
		}),
	);
	const combinedAssignees = (membersData?.items ?? [])
		.filter((mem) => mem.accesses?.includes("field"))
		.map((mem) => ({
			id: mem.user_id,
			full_name: mem.full_name,
			email: mem.email,
			photo_url: mem.photo_url,
		}));

	const [locationSearch, setLocationSearch] = useState("");
	const debouncedLocationSearch = useDebounce(locationSearch, 300);
	const { data: locationsData, isFetching: isLocationSearching } = useQuery(
		locationsQueryOptions(orgId, {
			page: 1,
			size: 20,
			q: debouncedLocationSearch || undefined,
		}),
	);
	const combinedLocations = locationsData?.items ?? [];

	return (
		<WorkOrderRelationsProvider value={relations}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<WorkOrderBasicSection
					form={form}
					titlePlaceholder={m.wo_placeholder_title_required()}
				/>

				<WorkOrderSchedulingSection form={form} />

				<TagsField
					form={form}
					name="tag_ids"
					label="Tags"
					allTags={allTags}
					onTagCreate={async (name) => {
						const result = await createTagMutation.mutateAsync({ name });
						return result.id;
					}}
				/>

				<ProcedureSelectField form={form} orgId={orgId} />

				<RelatedSection
					orgId={orgId}
					form={form}
					combinedAssignees={combinedAssignees}
					onAssigneesSearch={setAssigneesSearchQuery}
					isAssigneesSearching={isAssigneesSearching}
					combinedLocations={combinedLocations}
					onLocationSearch={setLocationSearch}
					isLocationSearching={isLocationSearching}
				/>

				<div className="flex gap-3 mt-5">
					<Button type="button" variant="outline" onClick={onCancel}>
						{m.wo_button_cancel()}
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? m.wo_button_creating() : m.wo_button_create()}
					</Button>
				</div>
			</form>
		</WorkOrderRelationsProvider>
	);
}
