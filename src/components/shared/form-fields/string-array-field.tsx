import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
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
import type { StringArrayFieldProps } from "./types";

export function StringArrayField({
	form,
	name,
	label,
	placeholder,
	addButtonText,
	icon: Icon,
	inputType = "text",
	onFieldChange,
	status,
}: StringArrayFieldProps) {
	const [inputValue, setInputValue] = useState("");

	return (
		<form.Field name={name}>
			{(field: {
				state: { value: string[] };
				handleChange: (v: string[]) => void;
			}) => (
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
								field.handleChange([...field.state.value, inputValue.trim()]);
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
										<ItemTitle>{item}</ItemTitle>
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
