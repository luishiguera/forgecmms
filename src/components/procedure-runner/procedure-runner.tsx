import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { procedureQueryOptions } from "@/lib/queries/procedures";
import * as m from "@/paraglide/messages";
import { isFieldBlock } from "@/server/domains/procedures/schema";
import type { JsonValue } from "@/server/json";
import { FieldInput } from "./field-input";
import { collectErrors, isVisible, type Responses } from "./validation";

export function ProcedureRunner({
	orgId,
	procedureId,
	name,
	responses,
	onSave,
	onCancel,
	isSaving,
	disabled,
}: {
	orgId: string;
	procedureId: number;
	name: string;
	responses: Responses;
	onSave: (responses: Responses) => void;
	onCancel?: () => void;
	isSaving?: boolean;
	disabled?: boolean;
}) {
	const { data: procedure, isLoading } = useQuery(
		procedureQueryOptions(orgId, procedureId),
	);
	const [draft, setDraft] = useState<Responses>(responses);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const fields = (procedure?.fields ?? []).filter(isFieldBlock);
	const visible = fields.filter((field) => isVisible(field, draft));

	const setValue = (fieldId: string, value: JsonValue | undefined) => {
		setDraft((current) => {
			if (value !== undefined) return { ...current, [fieldId]: value };
			const { [fieldId]: _cleared, ...rest } = current;
			return rest;
		});
		setErrors((current) => {
			if (!current[fieldId]) return current;
			const { [fieldId]: _removed, ...rest } = current;
			return rest;
		});
	};

	const submit = () => {
		const found = collectErrors(fields, draft);
		setErrors(found);
		if (Object.keys(found).length > 0) return;
		onSave(draft);
	};

	return (
		<div className="rounded-lg bg-card ring-1 ring-border">
			<div className="flex items-center gap-2 border-b px-4 py-3">
				<ListChecksIcon
					className="size-4 text-muted-foreground"
					weight="duotone"
				/>
				<span className="text-sm font-medium">{name}</span>
				{onCancel && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="ml-auto"
						aria-label={m.proc_runner_cancel()}
						onClick={onCancel}
					>
						<XIcon className="size-3.5" />
					</Button>
				)}
			</div>

			{isLoading ? (
				<div className="flex justify-center py-6">
					<Spinner className="size-5" />
				</div>
			) : visible.length === 0 ? (
				<p className="px-4 py-6 text-sm text-muted-foreground">
					{m.proc_runner_empty()}
				</p>
			) : (
				<>
					<div className="divide-y">
						{visible.map((field) => (
							<div key={field.id} className="flex flex-col gap-2 px-4 py-3">
								<div className="flex flex-col gap-0.5">
									<span className="text-sm font-medium">
										{field.label}
										{field.validation.some(
											(rule) => rule.type === "required",
										) && <span className="ml-1 text-destructive">*</span>}
									</span>
									{field.help_text && (
										<span className="text-xs text-muted-foreground">
											{field.help_text}
										</span>
									)}
								</div>

								<FieldInput
									orgId={orgId}
									field={field}
									value={draft[field.id]}
									disabled={disabled}
									onChange={(value) => setValue(field.id, value)}
								/>

								{errors[field.id] && (
									<span className="text-xs text-destructive">
										{errors[field.id]}
									</span>
								)}
							</div>
						))}
					</div>

					{!disabled && (
						<div className="flex justify-end border-t px-4 py-3">
							<Button type="button" onClick={submit} disabled={isSaving}>
								{isSaving ? (
									<Spinner className="size-4" />
								) : (
									<CheckIcon className="size-4" weight="bold" />
								)}
								{m.proc_runner_save()}
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
