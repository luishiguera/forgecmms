import { createContext, type ReactNode, useContext } from "react";
import type { FieldStatus } from "@/hooks/use-auto-save";
import type {
	WorkOrderAssetItemResponse,
	WorkOrderPartItemResponse,
} from "@/server/domains/workorders/schema";
import type { AddablePart } from "./-work-order-parts-field";

export interface WorkOrderRelations {
	mode: "create" | "edit";
	parts: {
		items: WorkOrderPartItemResponse[];
		onAdd: (part: AddablePart) => void;
		onRemove: (partId: number) => void;
		onChangePlanned: (partId: number, plannedQuantity: number) => void;
		onChangeUsed?: (partId: number, usedQuantity: number) => void;
	};
	assets: {
		seed: WorkOrderAssetItemResponse[];
		onAdd?: (assetId: number) => void;
		onRemove?: (assetId: number) => void;
		onAddProcedure?: (assetId: number, procedureId: number) => void;
		onRemoveProcedure?: (assetId: number, procedureId: number) => void;
	};
	assignees: {
		onAdd?: (id: number) => void;
		onRemove?: (id: number) => void;
	};
	procedures: {
		onAdd?: (id: number) => void;
		onRemove?: (id: number) => void;
	};
	status: {
		assets: FieldStatus;
		parts: FieldStatus;
		assignees: FieldStatus;
		procedures: FieldStatus;
	};
}

const WorkOrderRelationsContext = createContext<WorkOrderRelations | undefined>(
	undefined,
);

export function WorkOrderRelationsProvider({
	value,
	children,
}: {
	value: WorkOrderRelations;
	children: ReactNode;
}) {
	return (
		<WorkOrderRelationsContext.Provider value={value}>
			{children}
		</WorkOrderRelationsContext.Provider>
	);
}

export function useWorkOrderRelations(): WorkOrderRelations {
	const context = useContext(WorkOrderRelationsContext);
	if (!context) {
		throw new Error(
			"useWorkOrderRelations must be used within a WorkOrderRelationsProvider",
		);
	}
	return context;
}
