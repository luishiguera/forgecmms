import { PhoneIcon } from "@phosphor-icons/react/dist/csr/Phone";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { PhoneInput } from "./phone-input";
import type { BaseFieldProps } from "./types";

type PhoneEntry = { number: string };

interface PhoneArrayFieldProps extends BaseFieldProps {
	name: string;
	label: string;
	addButtonText: string;
	prefixPlaceholder?: string;
	numberPlaceholder?: string;
	emptyText: string;
}

export function PhoneArrayField({
	form,
	name,
	label,
	addButtonText,
	prefixPlaceholder,
	numberPlaceholder,
	emptyText,
	onFieldChange,
	status,
}: PhoneArrayFieldProps) {
	const [draft, setDraft] = useState("");

	return (
		<form.Field name={name}>
			{(field: {
				state: { value: PhoneEntry[] };
				handleChange: (v: PhoneEntry[]) => void;
			}) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{label}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<div className="space-y-2">
						<PhoneInput
							value={draft}
							onChange={setDraft}
							prefixPlaceholder={prefixPlaceholder}
							numberPlaceholder={numberPlaceholder}
							emptyText={emptyText}
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								if (!draft.trim()) return;
								field.handleChange([
									...field.state.value,
									{ number: draft.trim() },
								]);
								setDraft("");
								onFieldChange?.(name);
							}}
						>
							<PlusIcon className="size-4" />
							{addButtonText}
						</Button>
					</div>
					{field.state.value.length > 0 && (
						<div className="space-y-2 mt-2">
							{field.state.value.map((item, index) => {
								return (
									<Item key={index} variant="outline">
										<ItemMedia variant="image">
											<PhoneIcon className="w-5 h-5 text-muted-foreground" />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>{item.number}</ItemTitle>
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
								);
							})}
						</div>
					)}
				</Field>
			)}
		</form.Field>
	);
}
