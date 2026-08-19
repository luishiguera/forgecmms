import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FileIcon } from "@phosphor-icons/react/dist/csr/File";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { FormFieldConfig } from "@/components/procedure-builder/utils/types";
import { ProcedureRunner } from "@/components/procedure-runner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { procedureQueryOptions } from "@/lib/queries/procedures";
import * as m from "@/paraglide/messages";
import { isFieldBlock } from "@/server/domains/procedures/schema";
import type { ProcedureResponses } from "@/server/domains/workorders/schema";
import { formatDate } from "@/utils/format-date";

export const PLACEHOLDER = "—";

export function filenameFromUrl(url: string): string {
	const path = url.split("?")[0];
	const last = path.split("/").pop();
	if (!last) return url;
	try {
		return decodeURIComponent(last);
	} catch {
		return last;
	}
}

function toUrlList(value: unknown): string[] {
	if (Array.isArray(value)) return value.filter((v): v is string => !!v);
	if (typeof value === "string" && value) return [value];
	return [];
}

function signatureSrc(value: string): string {
	return value.startsWith("data:") ? value : `data:image/png;base64,${value}`;
}

export function ResponseValue({
	field,
	value,
}: {
	field: FormFieldConfig;
	value: unknown;
}) {
	if (
		value === null ||
		value === undefined ||
		value === "" ||
		(Array.isArray(value) && value.length === 0)
	) {
		return (
			<span className="text-sm text-muted-foreground/70">
				{m.wo_exec_no_response()}
			</span>
		);
	}

	switch (field.type) {
		case "toggle":
			return (
				<Badge variant={value ? undefined : "outline"}>
					{value ? m.wo_exec_toggle_yes() : m.wo_exec_toggle_no()}
				</Badge>
			);

		case "linear_scale":
			return (
				<span className="text-sm font-medium">
					{String(value)} / {field.scale_config?.max ?? 5}
				</span>
			);

		case "rating": {
			const max = field.rating_config?.max_rating ?? 5;
			const score = Number(value);
			return (
				<span className="flex items-center gap-1">
					{Array.from({ length: max }, (_, i) => (
						<StarIcon
							key={i}
							className="size-4 text-amber-500"
							weight={i < score ? "fill" : "regular"}
						/>
					))}
					<span className="text-xs text-muted-foreground ml-1">
						{score}/{max}
					</span>
				</span>
			);
		}

		case "checkboxes":
		case "multi_select":
			return (
				<div className="flex flex-wrap gap-1.5">
					{toUrlList(value).map((item) => (
						<Badge key={item} variant="secondary">
							{item}
						</Badge>
					))}
				</div>
			);

		case "matrix": {
			const rows = field.matrix_config?.rows ?? [];
			const map = value as Record<string, string>;
			return (
				<div className="space-y-1">
					{rows.map((row) => (
						<div key={row} className="flex items-center justify-between gap-4">
							<span className="text-xs text-muted-foreground">{row}</span>
							<span className="text-sm">{map[row] ?? PLACEHOLDER}</span>
						</div>
					))}
				</div>
			);
		}

		case "date":
			return (
				<span className="text-sm">
					{formatDate(String(value), { style: "medium" })}
				</span>
			);

		case "datetime":
			return (
				<span className="text-sm">
					{formatDate(String(value), { style: "medium", includeTime: true })}
				</span>
			);

		case "photo":
			return (
				<div className="flex flex-wrap gap-2">
					{toUrlList(value).map((url) => (
						<a
							key={url}
							href={url}
							download={filenameFromUrl(url)}
							target="_blank"
							rel="noreferrer"
							className="size-16 overflow-hidden rounded-md border bg-muted"
						>
							<img
								src={url}
								alt={filenameFromUrl(url)}
								className="size-full object-cover"
							/>
						</a>
					))}
				</div>
			);

		case "signature":
			return (
				<a
					href={signatureSrc(String(value))}
					download="signature.png"
					target="_blank"
					rel="noreferrer"
					className="block h-16 w-40 overflow-hidden rounded-md border bg-muted"
				>
					<img
						src={signatureSrc(String(value))}
						alt={field.label}
						className="size-full object-contain"
					/>
				</a>
			);

		case "file":
			return (
				<div className="flex flex-col gap-1.5">
					{toUrlList(value).map((url) => (
						<a
							key={url}
							href={url}
							download={filenameFromUrl(url)}
							target="_blank"
							rel="noreferrer"
							className="inline-flex w-fit items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
						>
							<FileIcon className="size-3.5 text-muted-foreground" />
							{filenameFromUrl(url)}
							<DownloadSimpleIcon className="size-3.5 text-muted-foreground" />
						</a>
					))}
				</div>
			);

		case "long_text":
			return (
				<p className="text-sm whitespace-pre-wrap leading-relaxed">
					{String(value)}
				</p>
			);

		default:
			return <span className="text-sm">{String(value)}</span>;
	}
}

export function ProcedureResponseCard({
	orgId,
	procedureId,
	name,
	responses,
	onSave,
	isSaving,
}: {
	orgId: string;
	procedureId: number;
	name: string;
	responses: ProcedureResponses;
	onSave: (next: ProcedureResponses) => void;
	isSaving: boolean;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const { data: procedure, isLoading } = useQuery(
		procedureQueryOptions(orgId, procedureId),
	);
	const fields = (procedure?.fields ?? []).filter(isFieldBlock);

	if (isEditing) {
		return (
			<ProcedureRunner
				orgId={orgId}
				procedureId={procedureId}
				name={name}
				responses={responses}
				isSaving={isSaving}
				onCancel={() => setIsEditing(false)}
				onSave={(next) => {
					onSave(next);
					setIsEditing(false);
				}}
			/>
		);
	}

	return (
		<div className="rounded-lg border bg-card">
			<div className="flex items-center gap-2 border-b px-4 py-3">
				<ListChecksIcon
					className="size-4 text-muted-foreground"
					weight="duotone"
				/>
				<span className="text-sm font-medium">{name}</span>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="ml-auto"
					onClick={() => setIsEditing(true)}
				>
					<PencilSimpleIcon className="size-3.5" />
					{m.wo_exec_fill()}
				</Button>
			</div>
			{isLoading ? (
				<div className="flex justify-center py-6">
					<Spinner className="size-5" />
				</div>
			) : fields.length > 0 ? (
				<div className="divide-y">
					{fields.map((field) => (
						<div key={field.id} className="px-4 py-3">
							<div className="text-xs text-muted-foreground mb-1.5">
								{field.label}
							</div>
							<ResponseValue field={field} value={responses[field.id]} />
						</div>
					))}
				</div>
			) : (
				<div className="divide-y">
					{Object.entries(responses).map(([key, value]) => (
						<div key={key} className="px-4 py-3">
							<div className="text-xs text-muted-foreground mb-1.5">{key}</div>
							<span className="text-sm">{String(value)}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
