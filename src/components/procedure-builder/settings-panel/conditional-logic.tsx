import { GitBranchIcon } from "@phosphor-icons/react/dist/csr/GitBranch";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import type { ConditionalRule, FormFieldConfig } from "../utils/types";

interface ConditionalLogicEditorProps {
	currentFieldId: string;
	allFields: FormFieldConfig[];
	conditionalLogic?: ConditionalRule;
	onUpdate: (conditionalLogic: ConditionalRule | undefined) => void;
}

type Operator = ConditionalRule["operator"];

const operatorLabels: Record<Operator, string> = {
	equals: "Equals",
	notEquals: "Does not equal",
	contains: "Contains",
	isEmpty: "Is empty",
	isNotEmpty: "Is not empty",
};

const operatorsNeedingValue: Operator[] = ["equals", "notEquals", "contains"];

export function ConditionalLogicEditor({
	currentFieldId,
	allFields,
	conditionalLogic,
	onUpdate,
}: ConditionalLogicEditorProps) {
	const availableFields = allFields.filter((f) => f.id !== currentFieldId);

	const handleAddCondition = () => {
		if (availableFields.length > 0) {
			onUpdate({
				field_id: availableFields[0].id,
				operator: "isNotEmpty",
				action: "show",
			});
		}
	};

	const handleRemoveCondition = () => {
		onUpdate(undefined);
	};

	const handleUpdateCondition = (updates: Partial<ConditionalRule>) => {
		if (conditionalLogic) {
			onUpdate({ ...conditionalLogic, ...updates });
		}
	};

	if (availableFields.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<GitBranchIcon
					className="size-10 text-muted-foreground/30"
					weight="duotone"
				/>
				<p className="mt-3 text-sm text-muted-foreground">
					Add more fields to create conditional logic
				</p>
				<p className="mt-1 text-xs text-muted-foreground/70">
					Conditional logic requires at least 2 fields
				</p>
			</div>
		);
	}

	if (!conditionalLogic) {
		return (
			<div className="space-y-4">
				<div className="flex flex-col items-center justify-center py-6 text-center">
					<GitBranchIcon
						className="size-10 text-muted-foreground/30"
						weight="duotone"
					/>
					<p className="mt-3 text-sm text-muted-foreground">
						No conditional logic set
					</p>
					<p className="mt-1 text-xs text-muted-foreground/70">
						Show or hide this field based on other field values
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAddCondition}
					className="w-full"
				>
					<PlusIcon className="size-4" weight="bold" />
					Add Condition
				</Button>
			</div>
		);
	}

	const needsValue = operatorsNeedingValue.includes(conditionalLogic.operator);
	const selectedField = allFields.find(
		(f) => f.id === conditionalLogic.field_id,
	);

	return (
		<div className="space-y-4">
			<div className="p-3 rounded-lg border border-border bg-card space-y-3">
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Action</Label>
					<Select
						value={conditionalLogic.action}
						onValueChange={(value) => {
							if (value)
								handleUpdateCondition({ action: value as "show" | "hide" });
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="show">Show this field</SelectItem>
							<SelectItem value="hide">Hide this field</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">When field</Label>
					<Select
						value={conditionalLogic.field_id}
						onValueChange={(value) => {
							if (value) handleUpdateCondition({ field_id: value });
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue>
								{selectedField?.label || "Select field..."}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{availableFields.map((field) => (
								<SelectItem key={field.id} value={field.id}>
									{field.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Condition</Label>
					<Select
						value={conditionalLogic.operator}
						onValueChange={(value) => {
							if (value) handleUpdateCondition({ operator: value as Operator });
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(operatorLabels).map(([op, label]) => (
								<SelectItem key={op} value={op}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{needsValue && (
					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground">Value</Label>
						{selectedField?.type &&
						["multiple_choice", "checkboxes", "multi_select"].includes(
							selectedField.type,
						) &&
						selectedField.options ? (
							<Select
								value={conditionalLogic.value || ""}
								onValueChange={(value) => {
									if (value) handleUpdateCondition({ value });
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{selectedField.options.map((option) => (
										<SelectItem key={option} value={option}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<Input
								value={conditionalLogic.value || ""}
								onChange={(e) =>
									handleUpdateCondition({ value: e.target.value })
								}
								placeholder="Enter value..."
							/>
						)}
					</div>
				)}

				<div className="pt-2 border-t border-border">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleRemoveCondition}
						className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
					>
						<TrashIcon className="size-4" weight="duotone" />
						Remove Condition
					</Button>
				</div>
			</div>

			<div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
				<span className="font-medium text-foreground">Summary: </span>
				{conditionalLogic.action === "show" ? "Show" : "Hide"} this field when "
				{selectedField?.label}"{" "}
				{operatorLabels[conditionalLogic.operator].toLowerCase()}
				{needsValue && conditionalLogic.value && ` "${conditionalLogic.value}"`}
			</div>
		</div>
	);
}

export default ConditionalLogicEditor;
