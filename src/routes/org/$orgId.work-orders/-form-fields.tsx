import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SelectField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { FieldStatusIndicator } from "@/components/ui/field-status-indicator";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import type { FieldStatus } from "@/hooks/use-auto-save";
import { proceduresQueryOptions } from "@/lib/queries/procedures";
import { getPriorityOptions, getTypeOptions } from "@/lib/work-orders/labels";
import * as m from "@/paraglide/messages";
import type { WorkOrderFormValues } from "./-types";
import { getStatusOptions } from "./-types";

type WorkOrderFormApi = any;

interface FieldProps {
	form: WorkOrderFormApi;
	orgId?: string;
	onFieldChange?: (fieldName: string) => void;
	status?: FieldStatus;
	required?: boolean;
}

interface TextFieldProps extends FieldProps {
	name: keyof WorkOrderFormValues;
	label: string;
	placeholder?: string;
	error?: string;
}

export function TextField({
	form,
	name,
	label,
	placeholder,
	onFieldChange,
	status,
	required,
	error,
}: TextFieldProps) {
	return (
		<form.Field
			name={name}
			children={(field: {
				state: { value: string };
				handleChange: (v: string) => void;
			}) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{label}
						{required && <span className="text-destructive">*</span>}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<InputGroup>
						<InputGroupInput
							value={field.state.value}
							onChange={(e) => {
								field.handleChange(e.target.value);
								onFieldChange?.(name);
							}}
							placeholder={placeholder}
							required={required}
						/>
					</InputGroup>
					{error && <FieldError>{error}</FieldError>}
				</Field>
			)}
		/>
	);
}

interface TextareaFieldProps extends FieldProps {
	name: keyof WorkOrderFormValues;
	label: string;
	placeholder?: string;
	rows?: number;
}

export function TextareaField({
	form,
	name,
	label,
	placeholder,
	onFieldChange,
	status,
	rows = 3,
}: TextareaFieldProps) {
	return (
		<form.Field
			name={name}
			children={(field: {
				state: { value: string };
				handleChange: (v: string) => void;
			}) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{label}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<Textarea
						value={field.state.value}
						onChange={(e) => {
							field.handleChange(e.target.value);
							onFieldChange?.(name);
						}}
						placeholder={placeholder}
						rows={rows}
					/>
				</Field>
			)}
		/>
	);
}

export function StatusSelectField(props: FieldProps) {
	return (
		<SelectField
			{...props}
			name="status"
			label={m.wo_field_status()}
			options={getStatusOptions()}
		/>
	);
}

export function PrioritySelectField(props: FieldProps) {
	return (
		<SelectField
			{...props}
			name="priority"
			label={m.wo_field_priority()}
			options={getPriorityOptions()}
		/>
	);
}

export function TypeSelectField(props: FieldProps) {
	return (
		<SelectField
			{...props}
			name="type"
			label={m.wo_field_type()}
			options={getTypeOptions()}
			description={m.wo_type_description()}
		/>
	);
}

interface ProcedureSelectFieldProps extends FieldProps {
	orgId: string;
	onAddProcedure?: (id: number) => void;
	onRemoveProcedure?: (id: number) => void;
}

export function ProcedureSelectField({
	form,
	orgId,
	onFieldChange,
	status,
	onAddProcedure,
	onRemoveProcedure,
}: ProcedureSelectFieldProps) {
	const { data: proceduresData } = useQuery(
		proceduresQueryOptions(orgId, { page: 1, size: 100 }),
	);

	const procedures = proceduresData?.items ?? [];
	const procedureMap = useMemo(
		() => new Map(procedures.map((p) => [p.id.toString(), p])),
		[procedures],
	);

	return (
		<form.Field
			name="procedure_ids"
			children={(field: {
				state: { value: number[] };
				handleChange: (v: number[]) => void;
			}) => {
				const selectedIds = new Set(field.state.value);
				const selectedProcedures = field.state.value
					.map((id) => procedureMap.get(id.toString()))
					.filter((p): p is NonNullable<typeof p> => p != null);
				const availableProcedures = procedures.filter(
					(p) => !selectedIds.has(p.id),
				);

				const handleAdd = (id: number) => {
					field.handleChange([...field.state.value, id]);
					if (onAddProcedure) {
						onAddProcedure(id);
					} else {
						onFieldChange?.("procedure_ids");
					}
				};

				const handleRemove = (id: number) => {
					field.handleChange(field.state.value.filter((v) => v !== id));
					if (onRemoveProcedure) {
						onRemoveProcedure(id);
					} else {
						onFieldChange?.("procedure_ids");
					}
				};

				return (
					<Field>
						<FieldLabel className="flex items-center gap-1.5">
							{m.wo_general_procedures_label()}
							{status && <FieldStatusIndicator status={status} />}
						</FieldLabel>
						<FieldDescription>
							{m.wo_general_procedures_description()}
						</FieldDescription>
						<Combobox
							value=""
							onValueChange={(value) => {
								if (value) {
									handleAdd(Number(value));
								}
							}}
							items={availableProcedures.map((p) => p.id.toString())}
							filter={(value, search) => {
								const procedure = procedureMap.get(value);
								if (!procedure) return false;
								const s = search.toLowerCase();
								return (
									procedure.name.toLowerCase().includes(s) ||
									procedure.description.toLowerCase().includes(s)
								);
							}}
						>
							<ComboboxInput placeholder={m.wo_add_procedure_placeholder()} />
							<ComboboxContent>
								<ComboboxList>
									{(item) => {
										const procedure = procedureMap.get(item);
										if (!procedure) return null;
										return (
											<ComboboxItem
												key={item}
												value={item}
												className="flex items-center gap-3 py-2"
											>
												<div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
													<ListChecksIcon className="w-4 h-4 text-muted-foreground" />
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-medium truncate">
														{procedure.name}
													</div>
													{procedure.description && (
														<div className="text-xs text-muted-foreground truncate">
															{procedure.description}
														</div>
													)}
												</div>
											</ComboboxItem>
										);
									}}
								</ComboboxList>
								<ComboboxEmpty>{m.wo_no_procedures_found()}</ComboboxEmpty>
							</ComboboxContent>
						</Combobox>
						{selectedProcedures.map((procedure) => (
							<Item key={procedure.id} variant="outline">
								<ItemMedia variant="image">
									<ListChecksIcon className="w-5 h-5 text-muted-foreground" />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{procedure.name}</ItemTitle>
									{procedure.description && (
										<ItemDescription>{procedure.description}</ItemDescription>
									)}
								</ItemContent>
								<ItemActions>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => handleRemove(procedure.id)}
									>
										<XIcon className="w-4 h-4" />
									</Button>
								</ItemActions>
							</Item>
						))}
					</Field>
				);
			}}
		/>
	);
}

interface DateTimeFieldProps extends FieldProps {
	name: "planned_start" | "planned_end";
	label: string;
}

export function DateTimeField({
	form,
	name,
	label,
	onFieldChange,
	status,
}: DateTimeFieldProps) {
	return (
		<form.Field
			name={name}
			children={(field: {
				state: { value: string };
				handleChange: (v: string) => void;
			}) => (
				<Field>
					<FieldLabel className="flex items-center gap-1.5">
						{label}
						{status && <FieldStatusIndicator status={status} />}
					</FieldLabel>
					<InputGroup>
						<InputGroupInput
							type="datetime-local"
							value={field.state.value}
							onChange={(e) => {
								field.handleChange(e.target.value);
								onFieldChange?.(name);
							}}
						/>
					</InputGroup>
				</Field>
			)}
		/>
	);
}
