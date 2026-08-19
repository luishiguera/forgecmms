import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import type { ElementType } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import type { FieldStatus } from "@/hooks/use-auto-save";

interface ObjectArrayFieldProps<T extends Record<string, string>> {
	form: any;
	name: string;
	label: string;
	placeholder?: string;
	addButtonText: string;
	icon: ElementType;
	inputType?: "text" | "email" | "tel";
	valueKey: keyof T;
	onFieldChange?: (name: string) => void;
	status?: FieldStatus;
}

export function ObjectArrayField<T extends Record<string, string>>({
	form,
	name,
	label,
	placeholder,
	addButtonText,
	icon: Icon,
	inputType = "text",
	valueKey,
	onFieldChange,
	status,
}: ObjectArrayFieldProps<T>) {
	const [inputValue, setInputValue] = useState("");

	return (
		<form.Field name={name}>
			{(field: { state: { value: T[] }; handleChange: (v: T[]) => void }) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{label}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<div className="space-y-2">
						<InputGroup>
							<InputGroupInput
								type={inputType}
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								placeholder={placeholder}
							/>
						</InputGroup>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								if (!inputValue.trim()) return;
								const newItem = { [valueKey]: inputValue.trim() } as T;
								field.handleChange([...field.state.value, newItem]);
								setInputValue("");
								onFieldChange?.(name);
							}}
						>
							<PlusIcon className="size-4" />
							{addButtonText}
						</Button>
					</div>
					{field.state.value.length > 0 && (
						<div className="space-y-2 mt-2">
							{field.state.value.map((item, index) => (
								<Item key={index} variant="outline">
									<ItemMedia variant="image">
										<Icon className="w-5 h-5 text-muted-foreground" />
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{item[valueKey]}</ItemTitle>
									</ItemContent>
									<ItemActions>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => {
												field.handleChange(
													field.state.value.filter((_, i) => i !== index),
												);
												onFieldChange?.(name);
											}}
										>
											<XIcon className="w-4 h-4" />
										</Button>
									</ItemActions>
								</Item>
							))}
						</div>
					)}
				</Field>
			)}
		</form.Field>
	);
}
