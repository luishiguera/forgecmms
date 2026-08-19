import { useStore } from "@tanstack/react-form";
import { useMemo, useRef } from "react";
import type {
	PartAssignment,
	WorkOrderPartItemResponse,
} from "@/server/domains/workorders/schema";
import type { WorkOrderFormValues } from "./-types";
import type { AddablePart } from "./-work-order-parts-field";
import type { WorkOrderRelations } from "./-work-order-relations-context";

type WorkOrderFormApi = any;

export function useCreateWorkOrderRelations(
	form: WorkOrderFormApi,
): WorkOrderRelations {
	const knownPartsRef = useRef(new Map<number, AddablePart>());

	const partAssignments: PartAssignment[] = useStore(
		form.store,
		(snapshot) =>
			(snapshot as { values: WorkOrderFormValues }).values.part_assignments,
	);

	const partItems = useMemo<WorkOrderPartItemResponse[]>(
		() =>
			partAssignments.map((assignment) => {
				const known = knownPartsRef.current.get(assignment.part_id);
				return {
					id: assignment.part_id,
					name: known?.name ?? "",
					sku: known?.sku ?? "",
					image_url: known?.image_url ?? "",
					planned_quantity: assignment.planned_quantity,
					used_quantity: 0,
				};
			}),
		[partAssignments],
	);

	return useMemo<WorkOrderRelations>(
		() => ({
			mode: "create",
			parts: {
				items: partItems,
				onAdd: (part) => {
					knownPartsRef.current.set(part.id, part);
					form.setFieldValue("part_assignments", [
						...form.getFieldValue("part_assignments"),
						{ part_id: part.id, planned_quantity: 1 },
					]);
				},
				onRemove: (partId) => {
					form.setFieldValue(
						"part_assignments",
						form
							.getFieldValue("part_assignments")
							.filter((p: PartAssignment) => p.part_id !== partId),
					);
				},
				onChangePlanned: (partId, plannedQuantity) => {
					form.setFieldValue(
						"part_assignments",
						form
							.getFieldValue("part_assignments")
							.map((p: PartAssignment) =>
								p.part_id === partId
									? { ...p, planned_quantity: plannedQuantity }
									: p,
							),
					);
				},
			},
			assets: { seed: [] },
			assignees: {},
			procedures: {},
			status: {
				assets: "idle",
				parts: "idle",
				assignees: "idle",
				procedures: "idle",
			},
		}),
		[form, partItems],
	);
}
