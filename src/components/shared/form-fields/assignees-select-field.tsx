import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import * as m from "@/paraglide/messages";
import type { BaseFieldProps } from "./types";

interface AssigneeItem {
	id: number;
	full_name: string;
	email: string;
	photo_url?: string | null;
}

interface AssigneesSelectFieldProps extends BaseFieldProps {
	name?: string;
	label?: string;
	placeholder?: string;
	assignees: AssigneeItem[];
	onSearch?: (query: string) => void;
	isSearching?: boolean;
	error?: string;
	onAddAssignee?: (id: number) => void;
	onRemoveAssignee?: (id: number) => void;
}

export function AssigneesSelectField({
	form,
	name = "assignee_ids",
	label,
	placeholder,
	assignees,
	onSearch,
	isSearching,
	error,
	onFieldChange,
	onAddAssignee,
	onRemoveAssignee,
	status,
}: AssigneesSelectFieldProps) {
	const resolvedLabel = label ?? m.shared_field_assignees();
	const resolvedPlaceholder = placeholder ?? m.shared_field_search_assignees();

	return (
		<form.Field
			name={name}
			children={(field: {
				state: { value: number[] };
				handleChange: (v: number[]) => void;
			}) => {
				const selectedAssignees = assignees.filter((a) =>
					field.state.value.includes(a.id),
				);
				const availableAssignees = assignees.filter(
					(a) => !field.state.value.includes(a.id),
				);

				const handleAdd = (id: number) => {
					field.handleChange([...field.state.value, id]);
					if (onAddAssignee) {
						onAddAssignee(id);
					} else {
						onFieldChange?.(name);
					}
				};

				const handleRemove = (id: number) => {
					field.handleChange(field.state.value.filter((v) => v !== id));
					if (onRemoveAssignee) {
						onRemoveAssignee(id);
					} else {
						onFieldChange?.(name);
					}
				};

				return (
					<Field>
						<FieldLabel className="flex items-center gap-1.5">
							{resolvedLabel}
							{status && <FieldStatusIndicator status={status} />}
						</FieldLabel>
						<Combobox
							value={null}
							onValueChange={(assignee: AssigneeItem | null) => {
								if (assignee && !field.state.value.includes(assignee.id)) {
									handleAdd(assignee.id);
								}
							}}
							items={availableAssignees}
							itemToStringLabel={(assignee: AssigneeItem) => assignee.full_name}
							filter={null}
						>
							<ComboboxInput
								placeholder={resolvedPlaceholder}
								onInput={(e) => onSearch?.(e.currentTarget.value)}
							/>
							<ComboboxContent>
								<ComboboxList>
									{(assignee: AssigneeItem) => (
										<ComboboxItem
											key={assignee.id}
											value={assignee}
											className="flex items-center gap-3 py-2"
										>
											<div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
												{assignee.photo_url ? (
													<img
														src={assignee.photo_url}
														alt=""
														className="w-full h-full object-cover"
													/>
												) : (
													<UserIcon className="w-4 h-4 text-muted-foreground" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-medium truncate">
													{assignee.full_name}
												</div>
												<div className="text-xs text-muted-foreground truncate">
													{assignee.email}
												</div>
											</div>
										</ComboboxItem>
									)}
								</ComboboxList>
								<ComboboxEmpty>
									{isSearching
										? m.shared_searching()
										: m.shared_no_assignees_found()}
								</ComboboxEmpty>
							</ComboboxContent>
						</Combobox>
						{selectedAssignees.length > 0 && (
							<div className="space-y-2 mt-2">
								{selectedAssignees.map((assignee) => (
									<Item key={assignee.id} variant="outline">
										<ItemMedia variant="image">
											{assignee.photo_url ? (
												<img src={assignee.photo_url} alt="" />
											) : (
												<UserIcon className="w-5 h-5 text-muted-foreground" />
											)}
										</ItemMedia>
										<ItemContent>
											<ItemTitle>{assignee.full_name}</ItemTitle>
											<ItemDescription>{assignee.email}</ItemDescription>
										</ItemContent>
										<ItemActions>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => {
													handleRemove(assignee.id);
												}}
											>
												<XIcon className="w-4 h-4" />
											</Button>
										</ItemActions>
									</Item>
								))}
							</div>
						)}
						{error && <FieldError>{error}</FieldError>}
					</Field>
				);
			}}
		/>
	);
}
