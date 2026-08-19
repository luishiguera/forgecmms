import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
	ProcedureEditor,
	type ProcedureEditorRef,
} from "@/components/procedure-builder/procedure-editor";
import { FieldSettings } from "@/components/procedure-builder/settings-panel/field-settings";
import {
	type EditorBlock,
	type FormFieldConfig,
	toProcedureBlocks,
} from "@/components/procedure-builder/utils/types";
import { TagsCombobox } from "@/components/shared/form-fields";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProcedureMutation } from "@/lib/queries/procedures";
import { tagsQueryOptions, useCreateTagMutation } from "@/lib/queries/tags";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/org/$orgId/procedures_/create")({
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId } = Route.useParams();
	const navigate = useNavigate();
	const editorRef = useRef<ProcedureEditorRef>(null);

	const { data: tagsData } = useQuery(tagsQueryOptions(orgId, "procedure"));
	const tags = tagsData ?? [];

	const createProcedureMutation = useCreateProcedureMutation(orgId);
	const createTagMutation = useCreateTagMutation(orgId, "procedure");

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const status = "active";
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
	const [fields, setFields] = useState<FormFieldConfig[]>([]);
	const [blocksState, setBlocksState] = useState<EditorBlock[]>([]);
	const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

	const handleSubmit = async () => {
		const result = await createProcedureMutation.mutateAsync({
			name,
			description: description || undefined,
			status,
			fields: toProcedureBlocks(blocksState),
			tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
		});

		navigate({
			to: "/org/$orgId/procedures",
			params: { orgId },
			search: { id: result.id },
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
						{m.proc_create_title()}
					</h1>
					<p className="text-muted-foreground">{m.proc_create_subtitle()}</p>
				</div>
				<Button
					onClick={handleSubmit}
					disabled={createProcedureMutation.isPending || !name.trim()}
				>
					{createProcedureMutation.isPending
						? m.proc_creating()
						: m.proc_create_button()}
				</Button>
			</div>

			<div className="flex-1 flex min-h-0 overflow-hidden">
				<div className="w-72 shrink-0 border-r overflow-y-auto p-4 space-y-4">
					<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
						{m.proc_basic_info()}
					</h2>

					{createProcedureMutation.isError && (
						<Alert variant="destructive">
							<WarningCircleIcon weight="duotone" />
							<AlertTitle>{createProcedureMutation.error?.message}</AlertTitle>
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
							ref={editorRef}
							initialData={{
								name: "",
								description: "",
								fields: [],
								status: "draft",
							}}
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
