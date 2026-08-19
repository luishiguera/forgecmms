import { HeartIcon } from "@phosphor-icons/react/dist/csr/Heart";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { ThumbsUpIcon } from "@phosphor-icons/react/dist/csr/ThumbsUp";
import type { FormFieldConfig } from "@/components/procedure-builder/utils/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type { JsonValue } from "@/server/json";
import { MediaInput } from "./media-input";
import { SignaturePad } from "./signature-pad";

const RATING_ICONS = {
	star: StarIcon,
	heart: HeartIcon,
	thumb: ThumbsUpIcon,
} as const;

const asStringList = (value: unknown): string[] =>
	Array.isArray(value) ? value.filter((item): item is string => !!item) : [];

const asRecord = (value: unknown): Record<string, string | string[]> =>
	value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, string | string[]>)
		: {};

export function FieldInput({
	orgId,
	field,
	value,
	onChange,
	disabled,
}: {
	orgId: string;
	field: FormFieldConfig;
	value: JsonValue | undefined;
	onChange: (value: JsonValue | undefined) => void;
	disabled?: boolean;
}) {
	const text = typeof value === "string" ? value : "";

	switch (field.type) {
		case "long_text":
			return (
				<Textarea
					value={text}
					disabled={disabled}
					rows={field.text_config?.min_rows ?? 3}
					maxLength={field.text_config?.max_length}
					placeholder={field.placeholder}
					onChange={(event) => onChange(event.target.value)}
				/>
			);

		case "number":
			return (
				<Input
					type="number"
					inputMode="decimal"
					value={value === null || value === undefined ? "" : String(value)}
					disabled={disabled}
					placeholder={field.placeholder}
					onChange={(event) =>
						onChange(event.target.value === "" ? undefined : event.target.value)
					}
				/>
			);

		case "date":
		case "datetime":
			return (
				<Input
					type={field.type === "date" ? "date" : "datetime-local"}
					value={text}
					disabled={disabled}
					className="w-fit"
					onChange={(event) => onChange(event.target.value || undefined)}
				/>
			);

		case "toggle":
			return (
				<Switch
					checked={value === true}
					disabled={disabled}
					onCheckedChange={(checked) => onChange(checked)}
				/>
			);

		case "multiple_choice":
			return (
				<RadioGroup
					value={text}
					disabled={disabled}
					onValueChange={(next) => onChange(next)}
					className="flex flex-col gap-2"
				>
					{(field.options ?? []).map((option) => (
						<label
							key={option}
							className="flex cursor-pointer items-center gap-2 text-sm"
						>
							<RadioGroupItem value={option} />
							{option}
						</label>
					))}
				</RadioGroup>
			);

		case "checkboxes":
		case "multi_select": {
			const selected = asStringList(value);
			return (
				<div className="flex flex-col gap-2">
					{(field.options ?? []).map((option) => (
						<label
							key={option}
							className="flex cursor-pointer items-center gap-2 text-sm"
						>
							<Checkbox
								checked={selected.includes(option)}
								disabled={disabled}
								onCheckedChange={(checked) =>
									onChange(
										checked
											? [...selected, option]
											: selected.filter((item) => item !== option),
									)
								}
							/>
							{option}
						</label>
					))}
				</div>
			);
		}

		case "linear_scale": {
			const min = field.scale_config?.min ?? 1;
			const max = field.scale_config?.max ?? 5;
			const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
			return (
				<div className="flex flex-col gap-1.5">
					<div className="flex flex-wrap gap-1.5">
						{steps.map((step) => (
							<Button
								key={step}
								type="button"
								size="sm"
								variant={Number(value) === step ? undefined : "outline"}
								disabled={disabled}
								className="w-10"
								onClick={() => onChange(step)}
							>
								{step}
							</Button>
						))}
					</div>
					{(field.scale_config?.min_label || field.scale_config?.max_label) && (
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>{field.scale_config?.min_label}</span>
							<span>{field.scale_config?.max_label}</span>
						</div>
					)}
				</div>
			);
		}

		case "rating": {
			const max = field.rating_config?.max_rating ?? 5;
			const Icon = RATING_ICONS[field.rating_config?.icon ?? "star"];
			const score = Number(value) || 0;
			return (
				<div className="flex items-center gap-1">
					{Array.from({ length: max }, (_, index) => index + 1).map((step) => (
						<button
							key={step}
							type="button"
							disabled={disabled}
							aria-label={String(step)}
							onClick={() => onChange(score === step ? undefined : step)}
						>
							<Icon
								className={cn(
									"size-6",
									step <= score ? "text-amber-500" : "text-muted-foreground/40",
								)}
								weight={step <= score ? "fill" : "regular"}
							/>
						</button>
					))}
				</div>
			);
		}

		case "matrix": {
			const rows = field.matrix_config?.rows ?? [];
			const columns = field.matrix_config?.columns ?? [];
			const allowMultiple = field.matrix_config?.allow_multiple ?? false;
			const answers = asRecord(value);

			const toggle = (row: string, column: string) => {
				if (!allowMultiple) {
					onChange({ ...answers, [row]: column });
					return;
				}
				const current = asStringList(answers[row]);
				onChange({
					...answers,
					[row]: current.includes(column)
						? current.filter((item) => item !== column)
						: [...current, column],
				});
			};

			const isChecked = (row: string, column: string) =>
				allowMultiple
					? asStringList(answers[row]).includes(column)
					: answers[row] === column;

			return (
				<div className="overflow-x-auto">
					<table className="w-full min-w-md text-sm">
						<thead>
							<tr className="border-b">
								<th className="p-2" />
								{columns.map((column) => (
									<th
										key={column}
										className="p-2 text-center text-xs font-normal text-muted-foreground"
									>
										{column}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y">
							{rows.map((row) => (
								<tr key={row}>
									<td className="p-2 text-xs text-muted-foreground">{row}</td>
									{columns.map((column) => (
										<td key={column} className="p-2 text-center">
											<Checkbox
												checked={isChecked(row, column)}
												disabled={disabled}
												onCheckedChange={() => toggle(row, column)}
											/>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
		}

		case "signature":
			return (
				<SignaturePad
					value={text || undefined}
					disabled={disabled}
					onChange={(next) => onChange(next)}
				/>
			);

		case "photo":
			return (
				<MediaInput
					orgId={orgId}
					kind="photo"
					value={asStringList(value)}
					disabled={disabled}
					multiple={field.photo_config?.multiple ?? false}
					maxFiles={field.photo_config?.max_files ?? 1}
					acceptedTypes={field.photo_config?.accepted_types ?? []}
					onChange={(next) => onChange(next)}
				/>
			);

		case "file":
			return (
				<MediaInput
					orgId={orgId}
					kind="file"
					value={asStringList(value)}
					disabled={disabled}
					multiple={field.file_config?.multiple ?? false}
					maxFiles={field.file_config?.max_files ?? 1}
					onChange={(next) => onChange(next)}
				/>
			);

		default:
			return (
				<Input
					type={
						field.type === "email"
							? "email"
							: field.type === "phone"
								? "tel"
								: field.type === "link"
									? "url"
									: "text"
					}
					value={text}
					disabled={disabled}
					maxLength={field.text_config?.max_length}
					placeholder={field.placeholder ?? m.proc_field_placeholder()}
					onChange={(event) => onChange(event.target.value || undefined)}
				/>
			);
	}
}
