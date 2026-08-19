import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import type { FieldType, ValidationRule } from "../utils/types";

interface ValidationRulesEditorProps {
	fieldType: FieldType;
	validation: ValidationRule[];
	onUpdate: (validation: ValidationRule[]) => void;
}

type ValidationType = ValidationRule["type"];

const validationTypesByFieldType: Record<FieldType, ValidationType[]> = {
	short_text: ["required", "min_length", "max_length", "pattern"],
	long_text: ["required", "min_length", "max_length"],
	email: ["required", "email"],
	phone: ["required", "phone"],
	link: ["required", "url"],
	multiple_choice: ["required"],
	checkboxes: ["required", "min", "max"],
	multi_select: ["required", "min", "max"],
	number: ["required", "min", "max"],
	linear_scale: ["required"],
	rating: ["required"],
	date: ["required"],
	datetime: ["required"],
	matrix: ["required"],
	signature: ["required"],
	photo: ["required"],
	file: ["required"],
	toggle: ["required"],
};

const validationLabels: Record<ValidationType, string> = {
	required: "Required",
	min: "Minimum Value",
	max: "Maximum Value",
	min_length: "Minimum Length",
	max_length: "Maximum Length",
	pattern: "Pattern (Regex)",
	email: "Valid Email",
	phone: "Valid Phone",
	url: "Valid URL",
	custom: "Custom",
};

export function ValidationRulesEditor({
	fieldType,
	validation,
	onUpdate,
}: ValidationRulesEditorProps) {
	const availableTypes = validationTypesByFieldType[fieldType] || ["required"];
	const isRequired = validation.some((v) => v.type === "required");

	const handleToggleRequired = (checked: boolean) => {
		if (checked) {
			if (!isRequired) {
				onUpdate([
					...validation,
					{ type: "required", message: "This field is required" },
				]);
			}
		} else {
			onUpdate(validation.filter((v) => v.type !== "required"));
		}
	};

	const handleAddRule = () => {
		const unusedTypes = availableTypes.filter(
			(t) => t !== "required" && !validation.some((v) => v.type === t),
		);
		if (unusedTypes.length > 0) {
			const newType = unusedTypes[0];
			onUpdate([
				...validation,
				{ type: newType, value: "", message: getDefaultMessage(newType) },
			]);
		}
	};

	const handleUpdateRule = (
		index: number,
		updates: Partial<ValidationRule>,
	) => {
		const newValidation = [...validation];
		newValidation[index] = { ...newValidation[index], ...updates };
		onUpdate(newValidation);
	};

	const handleRemoveRule = (index: number) => {
		onUpdate(validation.filter((_, i) => i !== index));
	};

	const nonRequiredRules = validation.filter((v) => v.type !== "required");
	const availableNonRequiredTypes = availableTypes.filter(
		(t) => t !== "required" && !validation.some((v) => v.type === t),
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
				<div className="flex items-center gap-2">
					<Label
						htmlFor="required-toggle"
						className="text-sm font-medium cursor-pointer"
					>
						Required Field
					</Label>
				</div>
				<Checkbox
					id="required-toggle"
					checked={isRequired}
					onCheckedChange={handleToggleRequired}
				/>
			</div>

			{nonRequiredRules.length > 0 && (
				<div className="space-y-3">
					<Label className="text-xs text-muted-foreground">
						Validation Rules
					</Label>
					{nonRequiredRules.map((rule) => {
						const actualIndex = validation.findIndex(
							(v) => v.type === rule.type,
						);
						return (
							<ValidationRuleItem
								key={rule.type}
								rule={rule}
								availableTypes={availableNonRequiredTypes}
								onUpdate={(updates) => handleUpdateRule(actualIndex, updates)}
								onRemove={() => handleRemoveRule(actualIndex)}
							/>
						);
					})}
				</div>
			)}

			{availableNonRequiredTypes.length > 0 && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAddRule}
					className="w-full cursor-pointer"
				>
					<PlusIcon className="size-4" weight="bold" />
					Add Validation Rule
				</Button>
			)}

			{availableTypes.length === 1 && availableTypes[0] === "required" && (
				<p className="text-xs text-muted-foreground text-center py-2">
					Only "Required" validation is available for this field type.
				</p>
			)}
		</div>
	);
}

interface ValidationRuleItemProps {
	rule: ValidationRule;
	availableTypes: ValidationType[];
	onUpdate: (updates: Partial<ValidationRule>) => void;
	onRemove: () => void;
}

function ValidationRuleItem({
	rule,
	availableTypes,
	onUpdate,
	onRemove,
}: ValidationRuleItemProps) {
	const needsValue = [
		"min",
		"max",
		"min_length",
		"max_length",
		"pattern",
	].includes(rule.type);
	const isNumericValue = ["min", "max", "min_length", "max_length"].includes(
		rule.type,
	);

	return (
		<div className="space-y-2 p-3 rounded-lg border border-border bg-card">
			<div className="flex items-center justify-between">
				<Select
					value={rule.type}
					onValueChange={(value) => onUpdate({ type: value as ValidationType })}
				>
					<SelectTrigger className="w-45 cursor-pointer">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={rule.type} className="cursor-pointer">
							{validationLabels[rule.type]}
						</SelectItem>
						{availableTypes.map((type) => (
							<SelectItem key={type} value={type} className="cursor-pointer">
								{validationLabels[type]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<button
					type="button"
					onClick={onRemove}
					className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
				>
					<TrashIcon className="size-4" weight="duotone" />
				</button>
			</div>

			{needsValue && (
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Value</Label>
					<Input
						type={isNumericValue ? "number" : "text"}
						value={rule.value ?? ""}
						onChange={(e) =>
							onUpdate({
								value: isNumericValue ? Number(e.target.value) : e.target.value,
							})
						}
						placeholder={
							rule.type === "pattern" ? "e.g., ^[A-Za-z]+$" : "Enter value..."
						}
					/>
				</div>
			)}

			<div className="space-y-1.5">
				<Label className="text-xs text-muted-foreground">Error Message</Label>
				<Input
					value={rule.message}
					onChange={(e) => onUpdate({ message: e.target.value })}
					placeholder="Enter error message..."
				/>
			</div>
		</div>
	);
}

function getDefaultMessage(type: ValidationType): string {
	const messages: Record<ValidationType, string> = {
		required: "This field is required",
		min: "Value is too small",
		max: "Value is too large",
		min_length: "Input is too short",
		max_length: "Input is too long",
		pattern: "Invalid format",
		email: "Please enter a valid email address",
		phone: "Please enter a valid phone number",
		url: "Please enter a valid URL",
		custom: "Validation failed",
	};
	return messages[type];
}

export default ValidationRulesEditor;
