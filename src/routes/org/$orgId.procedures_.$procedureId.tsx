import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
	ProcedureEditor,
	type ProcedureEditorRef,
} from "@/components/procedure-builder/procedure-editor";
import { FieldSettings } from "@/components/procedure-builder/settings-panel/field-settings";
import {
	type EditorBlock,
	type FormFieldConfig,
	type ProcedureBuilderData,
	splitProcedureBlocks,
	toProcedureBlocks,
} from "@/components/procedure-builder/utils/types";
import { TagsCombobox } from "@/components/shared/form-fields";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
	procedureQueryOptions,
	useDeleteProcedureMutation,
	useSetProcedureTagsMutation,
	useUpdateProcedureMutation,
} from "@/lib/queries/procedures";
import { tagsQueryOptions, useCreateTagMutation } from "@/lib/queries/tags";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/org/$orgId/procedures_/$procedureId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId, procedureId } = Route.useParams();
	const navigate = useNavigate();
	const editorRef = useRef<ProcedureEditorRef>(null);

	const { data: procedure, isLoading } = useQuery(
		procedureQueryOptions(orgId, Number(procedureId)),
	);
	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "procedure"));
	const tags = tagsData ?? [];

	const updateProcedureMutation = useUpdateProcedureMutation(orgId);
	const deleteProcedureMutation = useDeleteProcedureMutation(orgId);
	const setTagsMutation = useSetProcedureTagsMutation(
		orgId,
		Number(procedureId),
	);
	const createTagMutation = useCreateTagMutation(orgId, "procedure");

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [status, setStatus] = useState<"draft" | "active" | "archived">(
		"draft",
	);
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
	const [fields, setFields] = useState<FormFieldConfig[]>([]);
	const [blocksState, setBlocksState] = useState<EditorBlock[]>([]);
	const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
	const [initialData, setInitialData] = useState<ProcedureBuilderData | null>(
		null,
	);

	useEffect(() => {
		if (procedure) {
			setName(procedure.name);
			setDescription(procedure.description ?? "");
			setStatus(procedure.status as "draft" | "active" | "archived");
			setSelectedTagIds(procedure.tags.map((t) => t.id));

			const { fields: procedureFields, embeds: procedureEmbeds } =
				splitProcedureBlocks(procedure.fields);

			setFields(procedureFields);
			setInitialData({
				id: procedure.id,
				name: procedure.name,
				description: procedure.description ?? "",
				fields: procedureFields,
				embeds: procedureEmbeds,
				status: procedure.status as "draft" | "active" | "archived",
			});
		}
	}, [procedure]);

	const handleSave = async () => {
		await Promise.all([
			updateProcedureMutation.mutateAsync({
				procedureId: Number(procedureId),
				data: {
					name,
					description,
					status,
					fields: toProcedureBlocks(blocksState),
				},
			}),
			setTagsMutation.mutateAsync(selectedTagIds),
		]);
	};

	const handleDelete = async () => {
		await deleteProcedureMutation.mutateAsync(Number(procedureId));
		navigate({
			to: "/org/$orgId/procedures",
			params: { orgId },
		});
	};

	const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

	const handleFieldUpdate = (updates: Partial<FormFieldConfig>) => {
		if (!selectedFieldId) return;
		setFields((prev) =>
			prev.map((f) => (f.id === selectedFieldId ? { ...f, ...updates } : f)),
		);
		editorRef.current?.updateField(selectedFieldId, updates);
	};

	if (isLoading || !initialData) {
		return (
			<div className="flex items-center justify-center flex-1">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<>
			<div className="flex items-center gap-4 shrink-0 px-4 lg:px-6 py-4 border-b">
				<Button
					variant="ghost"
					size="icon"
					render={<Link to="/org/$orgId/procedures" params={{ orgId }} />}
				>
					<ArrowLeftIcon className="size-4" weight="bold" />
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						{m.proc_edit_title()}
					</h1>
					<p className="text-muted-foreground">{procedure?.name}</p>
				</div>
				<div className="flex items-center gap-2">
					<Dialog>
						<DialogTrigger
							render={
								<Button variant="outline" size="sm">
									<TrashIcon className="size-4" />
									{m.proc_delete_button()}
								</Button>
							}
						/>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{m.proc_delete_title()}</DialogTitle>
								<DialogDescription>
									{m.proc_delete_description()}
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<DialogClose
									render={
										<Button variant="outline">{m.proc_delete_cancel()}</Button>
									}
								/>
								<Button
									variant="destructive"
									onClick={handleDelete}
									disabled={deleteProcedureMutation.isPending}
								>
									{deleteProcedureMutation.isPending
										? m.proc_deleting()
										: m.proc_delete_button()}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<Button
						onClick={handleSave}
						disabled={
							updateProcedureMutation.isPending ||
							setTagsMutation.isPending ||
							!name.trim()
						}
					>
						{updateProcedureMutation.isPending || setTagsMutation.isPending
							? m.proc_saving()
							: m.proc_save_button()}
					</Button>
				</div>
			</div>

			<div className="flex-1 flex min-h-0 overflow-hidden">
				<div className="w-72 shrink-0 border-r overflow-y-auto p-4 space-y-4">
					<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
						{m.proc_basic_info()}
					</h2>

					{updateProcedureMutation.isError && (
						<Alert variant="destructive">
							<WarningCircleIcon weight="duotone" />
							<AlertTitle>{updateProcedureMutation.error?.message}</AlertTitle>
						</Alert>
					)}

					<Field>
						<FieldLabel>{m.proc_name_label()}</FieldLabel>
						<InputGroup>
							<InputGroupInput
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={m.proc_name_placeholder()}
								required
							/>
						</InputGroup>
					</Field>

					<Field>
						<FieldLabel>{m.proc_description_label()}</FieldLabel>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={m.proc_description_placeholder()}
							rows={3}
						/>
					</Field>

					<Field>
						<FieldLabel>{m.proc_tags_label()}</FieldLabel>
						<TagsCombobox
							value={selectedTagIds}
							onChange={setSelectedTagIds}
							allTags={tags}
							onTagCreate={async (name) => {
								const result = await createTagMutation.mutateAsync({ name });
								return result.id;
							}}
						/>
					</Field>
				</div>

				<div className="flex-1 overflow-auto">
					<div className="max-w-3xl mx-auto py-6 px-6">
						<ProcedureEditor
							key={initialData.id}
							ref={editorRef}
							initialData={initialData}
							selectedFieldId={selectedFieldId}
							onFieldSelect={setSelectedFieldId}
							onFieldsChange={setFields}
							onBlocksChange={setBlocksState}
						/>
					</div>
				</div>

				<div className="w-80 shrink-0 border-l overflow-hidden">
					<FieldSettings
						field={selectedField}
						allFields={fields}
						onUpdate={handleFieldUpdate}
						onClose={() => setSelectedFieldId(null)}
					/>
				</div>
			</div>
		</>
	);
}
