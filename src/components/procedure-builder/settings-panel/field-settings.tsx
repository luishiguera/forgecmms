import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { HeartIcon } from "@phosphor-icons/react/dist/csr/Heart";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { ThumbsUpIcon } from "@phosphor-icons/react/dist/csr/ThumbsUp";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import * as m from "@/paraglide/messages";
import type {
	FileConfig,
	FormFieldConfig,
	MatrixConfig,
	PhotoConfig,
	RatingConfig,
	ScaleConfig,
	TextConfig,
} from "../utils/types";

interface FieldSettingsProps {
	field: FormFieldConfig | null;
	allFields: FormFieldConfig[];
	onUpdate: (updates: Partial<FormFieldConfig>) => void;
	onClose: () => void;
}

export function FieldSettings({
	field,
	onUpdate,
	onClose,
}: FieldSettingsProps) {
	if (!field) {
		return (
			<div className="h-full flex flex-col items-center justify-center text-center p-6">
				<GearSixIcon
					className="size-12 text-muted-foreground/30"
					weight="duotone"
				/>
				<p className="mt-4 text-sm text-muted-foreground">
					{m.proc_field_select_prompt()}
				</p>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			<div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
				<div className="flex items-center gap-2">
					<GearSixIcon
						className="size-5 text-muted-foreground"
						weight="duotone"
					/>
					<span className="font-medium text-sm">
						{m.proc_field_settings_title()}
					</span>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
				>
					<XIcon className="size-4" weight="bold" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-4">
				<PropertiesTab field={field} onUpdate={onUpdate} />
			</div>
		</div>
	);
}

interface PropertiesTabProps {
	field: FormFieldConfig;
	onUpdate: (updates: Partial<FormFieldConfig>) => void;
}

function PropertiesTab({ field, onUpdate }: PropertiesTabProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<Label htmlFor="field-label" className="text-xs">
					{m.proc_field_label()}
				</Label>
				<Input
					id="field-label"
					value={field.label}
					onChange={(e) => onUpdate({ label: e.target.value })}
					placeholder="Enter field label..."
				/>
			</div>

			{[
				"short_text",
				"long_text",
				"email",
				"phone",
				"link",
				"number",
				"multi_select",
				"date",
				"datetime",
			].includes(field.type) && (
				<div className="space-y-1.5">
					<Label htmlFor="field-placeholder" className="text-xs">
						{m.proc_field_placeholder_label()}
					</Label>
					<Input
						id="field-placeholder"
						value={field.placeholder || ""}
						onChange={(e) => onUpdate({ placeholder: e.target.value })}
						placeholder="Enter placeholder text..."
					/>
				</div>
			)}

			<div className="space-y-1.5">
				<Label htmlFor="field-help" className="text-xs">
					{m.proc_field_help_text()}
				</Label>
				<Textarea
					id="field-help"
					value={field.help_text || ""}
					onChange={(e) => onUpdate({ help_text: e.target.value })}
					placeholder="Add helpful instructions for users..."
					className="min-h-15 resize-none"
				/>
			</div>

			{["multiple_choice", "checkboxes", "multi_select"].includes(
				field.type,
			) && (
				<OptionsEditor
					options={field.options || []}
					onUpdate={(options) => onUpdate({ options })}
				/>
			)}

			{field.type === "photo" && (
				<PhotoConfigEditor
					config={
						field.photo_config || {
							multiple: false,
							max_files: 1,
							accepted_types: [
								"image/jpeg",
								"image/png",
								"image/webp",
								"image/gif",
								"image/svg+xml",
								"image/heic",
								"image/heif",
								"image/bmp",
							],
						}
					}
					onUpdate={(photo_config) => onUpdate({ photo_config })}
				/>
			)}

			{field.type === "file" && (
				<FileConfigEditor
					config={
						field.file_config || {
							multiple: false,
							max_files: 1,
							accepted_types: [],
						}
					}
					onUpdate={(file_config) => onUpdate({ file_config })}
				/>
			)}

			{field.type === "linear_scale" && (
				<ScaleConfigEditor
					config={
						field.scale_config || {
							min: 1,
							max: 5,
							min_label: "",
							max_label: "",
						}
					}
					onUpdate={(scale_config) => onUpdate({ scale_config })}
				/>
			)}

			{field.type === "rating" && (
				<RatingConfigEditor
					config={field.rating_config || { max_rating: 5, icon: "star" }}
					onUpdate={(rating_config) => onUpdate({ rating_config })}
				/>
			)}

			{field.type === "matrix" && (
				<MatrixConfigEditor
					config={
						field.matrix_config || {
							rows: ["Row 1", "Row 2"],
							columns: ["Column 1", "Column 2"],
							allow_multiple: false,
						}
					}
					onUpdate={(matrix_config) => onUpdate({ matrix_config })}
				/>
			)}

			{field.type === "long_text" && (
				<TextConfigEditor
					config={field.text_config || { min_rows: 3, max_rows: 10 }}
					onUpdate={(text_config) => onUpdate({ text_config })}
				/>
			)}

			<div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
				<Label
					htmlFor="required-toggle"
					className="text-sm font-medium cursor-pointer"
				>
					{m.proc_field_required()}
				</Label>
				<Checkbox
					id="required-toggle"
					checked={field.validation.some((v) => v.type === "required")}
					onCheckedChange={(checked) => {
						if (checked) {
							if (!field.validation.some((v) => v.type === "required")) {
								onUpdate({
									validation: [
										...field.validation,
										{ type: "required", message: "This field is required" },
									],
								});
							}
						} else {
							onUpdate({
								validation: field.validation.filter(
									(v) => v.type !== "required",
								),
							});
						}
					}}
				/>
			</div>

			<div className="pt-2 border-t border-border">
				<Label className="text-xs text-muted-foreground">
					{m.proc_field_type()}
				</Label>
				<div className="mt-1">
					<Badge variant="outline" className="capitalize">
						{field.type.replace(/_/g, " ")}
					</Badge>
				</div>
			</div>
		</div>
	);
}

interface OptionsEditorProps {
	options: string[];
	onUpdate: (options: string[]) => void;
}

function OptionsEditor({ options, onUpdate }: OptionsEditorProps) {
	const [newOption, setNewOption] = useState("");

	const handleAddOption = () => {
		if (newOption.trim()) {
			onUpdate([...options, newOption.trim()]);
			setNewOption("");
		}
	};

	const handleRemoveOption = (index: number) => {
		onUpdate(options.filter((_, i) => i !== index));
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddOption();
		}
	};

	return (
		<div className="space-y-1.5">
			<Label className="text-xs">{m.proc_field_options()}</Label>
			<div className="space-y-1.5">
				{options.map((option, index) => (
					<div key={index} className="flex items-center gap-2">
						<Input
							value={option}
							onChange={(e) => {
								const newOptions = [...options];
								newOptions[index] = e.target.value;
								onUpdate(newOptions);
							}}
							className="flex-1"
						/>
						<button
							type="button"
							onClick={() => handleRemoveOption(index)}
							className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
						>
							<XIcon className="size-4" weight="bold" />
						</button>
					</div>
				))}
				<div className="flex items-center gap-2">
					<Input
						value={newOption}
						onChange={(e) => setNewOption(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={m.proc_field_add_option_placeholder()}
						className="flex-1"
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleAddOption}
						disabled={!newOption.trim()}
						className="cursor-pointer"
					>
						{m.proc_field_add()}
					</Button>
				</div>
			</div>
		</div>
	);
}

interface PhotoConfigEditorProps {
	config: PhotoConfig;
	onUpdate: (config: PhotoConfig) => void;
}

function PhotoConfigEditor({ config, onUpdate }: PhotoConfigEditorProps) {
	return (
		<div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
			<Label className="text-xs font-medium">{m.proc_photo_settings()}</Label>

			<div className="flex items-center justify-between">
				<Label htmlFor="photo-multiple" className="text-xs cursor-pointer">
					{m.proc_photo_allow_multiple()}
				</Label>
				<Checkbox
					id="photo-multiple"
					checked={config.multiple}
					onCheckedChange={(checked) =>
						onUpdate({
							...config,
							multiple: !!checked,
							max_files: checked ? config.max_files : 1,
						})
					}
				/>
			</div>

			{config.multiple && (
				<div className="space-y-1.5">
					<Label htmlFor="photo-max-files" className="text-xs">
						{m.proc_photo_max_files()}
					</Label>
					<Input
						id="photo-max-files"
						type="number"
						min={1}
						max={20}
						value={config.max_files}
						onChange={(e) =>
							onUpdate({
								...config,
								max_files: Math.min(20, parseInt(e.target.value, 10) || 1),
							})
						}
					/>
				</div>
			)}
		</div>
	);
}

interface FileConfigEditorProps {
	config: FileConfig;
	onUpdate: (config: FileConfig) => void;
}

function FileConfigEditor({ config, onUpdate }: FileConfigEditorProps) {
	return (
		<div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
			<Label className="text-xs font-medium">{m.proc_file_settings()}</Label>

			<div className="flex items-center justify-between">
				<Label htmlFor="file-multiple" className="text-xs cursor-pointer">
					{m.proc_file_allow_multiple()}
				</Label>
				<Checkbox
					id="file-multiple"
					checked={config.multiple}
					onCheckedChange={(checked) =>
						onUpdate({
							...config,
							multiple: !!checked,
							max_files: checked ? config.max_files : 1,
						})
					}
				/>
			</div>

			{config.multiple && (
				<div className="space-y-1.5">
					<Label htmlFor="file-max-files" className="text-xs">
						{m.proc_file_max_files()}
					</Label>
					<Input
						id="file-max-files"
						type="number"
						min={1}
						max={20}
						value={config.max_files}
						onChange={(e) =>
							onUpdate({
								...config,
								max_files: Math.min(20, parseInt(e.target.value, 10) || 1),
							})
						}
					/>
				</div>
			)}
		</div>
	);
}

interface ScaleConfigEditorProps {
	config: ScaleConfig;
	onUpdate: (config: ScaleConfig) => void;
}

function ScaleConfigEditor({ config, onUpdate }: ScaleConfigEditorProps) {
	return (
		<div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
			<Label className="text-xs font-medium">{m.proc_scale_settings()}</Label>

			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-1.5">
					<Label htmlFor="scale-min" className="text-xs">
						{m.proc_scale_min()}
					</Label>
					<Input
						id="scale-min"
						type="number"
						min={0}
						max={config.max - 1}
						value={config.min}
						onChange={(e) =>
							onUpdate({ ...config, min: parseInt(e.target.value, 10) || 0 })
						}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="scale-max" className="text-xs">
						{m.proc_scale_max()}
					</Label>
					<Input
						id="scale-max"
						type="number"
						min={config.min + 1}
						max={10}
						value={config.max}
						onChange={(e) =>
							onUpdate({ ...config, max: parseInt(e.target.value, 10) || 5 })
						}
					/>
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="scale-min-label" className="text-xs">
					{m.proc_scale_min_label()}
				</Label>
				<Input
					id="scale-min-label"
					value={config.min_label || ""}
					onChange={(e) => onUpdate({ ...config, min_label: e.target.value })}
					placeholder="e.g., Very bad"
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="scale-max-label" className="text-xs">
					{m.proc_scale_max_label()}
				</Label>
				<Input
					id="scale-max-label"
					value={config.max_label || ""}
					onChange={(e) => onUpdate({ ...config, max_label: e.target.value })}
					placeholder="e.g., Excellent"
				/>
			</div>
		</div>
	);
}

interface RatingConfigEditorProps {
	config: RatingConfig;
	onUpdate: (config: RatingConfig) => void;
}

function RatingConfigEditor({ config, onUpdate }: RatingConfigEditorProps) {
	const iconOptions = [
		{ value: "star", label: m.proc_rating_stars(), icon: StarIcon },
		{ value: "heart", label: m.proc_rating_hearts(), icon: HeartIcon },
		{ value: "thumb", label: m.proc_rating_thumbs(), icon: ThumbsUpIcon },
	] as const;

	return (
		<div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
			<Label className="text-xs font-medium">{m.proc_rating_settings()}</Label>

			<div className="space-y-1.5">
				<Label htmlFor="rating-max" className="text-xs">
					{m.proc_rating_max()}
				</Label>
				<Select
					value={config.max_rating.toString()}
					onValueChange={(value) => {
						if (value) onUpdate({ ...config, max_rating: parseInt(value, 10) });
					}}
				>
					<SelectTrigger className="cursor-pointer">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="5" className="cursor-pointer">
							5
						</SelectItem>
						<SelectItem value="10" className="cursor-pointer">
							10
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1.5">
				<Label className="text-xs">{m.proc_rating_icon()}</Label>
				<div className="flex gap-2">
					{iconOptions.map((option) => {
						const Icon = option.icon;
						return (
							<button
								key={option.value}
								type="button"
								onClick={() => onUpdate({ ...config, icon: option.value })}
								className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-md border cursor-pointer transition-colors ${
									config.icon === option.value
										? "border-primary bg-primary/10 text-primary"
										: "border-border hover:bg-muted"
								}`}
							>
								<Icon className="size-4" weight="duotone" />
								<span className="text-xs">{option.label}</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

interface MatrixConfigEditorProps {
	config: MatrixConfig;
	onUpdate: (config: MatrixConfig) => void;
}

function MatrixConfigEditor({ config, onUpdate }: MatrixConfigEditorProps) {
	const [newRow, setNewRow] = useState("");
	const [newColumn, setNewColumn] = useState("");

	const handleAddRow = () => {
		if (newRow.trim()) {
			onUpdate({ ...config, rows: [...config.rows, newRow.trim()] });
			setNewRow("");
		}
	};

	const handleAddColumn = () => {
		if (newColumn.trim()) {
			onUpdate({ ...config, columns: [...config.columns, newColumn.trim()] });
			setNewColumn("");
		}
	};

	return (
		<div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
			<Label className="text-xs font-medium">{m.proc_matrix_settings()}</Label>

			<div className="flex items-center justify-between">
				<Label htmlFor="matrix-multiple" className="text-xs cursor-pointer">
					{m.proc_matrix_allow_multiple()}
				</Label>
				<Checkbox
					id="matrix-multiple"
					checked={config.allow_multiple}
					onCheckedChange={(checked) =>
						onUpdate({ ...config, allow_multiple: !!checked })
					}
				/>
			</div>

			<div className="space-y-1.5">
				<Label className="text-xs">{m.proc_matrix_rows()}</Label>
				{config.rows.map((row, index) => (
					<div key={index} className="flex items-center gap-2">
						<Input
							value={row}
							onChange={(e) => {
								const newRows = [...config.rows];
								newRows[index] = e.target.value;
								onUpdate({ ...config, rows: newRows });
							}}
							className="flex-1"
						/>
						<button
							type="button"
							onClick={() =>
								onUpdate({
									...config,
									rows: config.rows.filter((_, i) => i !== index),
								})
							}
							className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
							disabled={config.rows.length <= 1}
						>
							<XIcon className="size-4" weight="bold" />
						</button>
					</div>
				))}
				<div className="flex items-center gap-2">
					<Input
						value={newRow}
						onChange={(e) => setNewRow(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleAddRow();
							}
						}}
						placeholder={m.proc_matrix_add_row_placeholder()}
						className="flex-1"
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleAddRow}
						disabled={!newRow.trim()}
						className="cursor-pointer"
					>
						{m.proc_field_add()}
					</Button>
				</div>
			</div>

			<div className="space-y-1.5">
				<Label className="text-xs">{m.proc_matrix_columns()}</Label>
				{config.columns.map((column, index) => (
					<div key={index} className="flex items-center gap-2">
						<Input
							value={column}
							onChange={(e) => {
								const newColumns = [...config.columns];
								newColumns[index] = e.target.value;
								onUpdate({ ...config, columns: newColumns });
							}}
							className="flex-1"
						/>
						<button
							type="button"
							onClick={() =>
								onUpdate({
									...config,
									columns: config.columns.filter((_, i) => i !== index),
								})
							}
							className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
							disabled={config.columns.length <= 1}
						>
							<XIcon className="size-4" weight="bold" />
						</button>
					</div>
				))}
				<div className="flex items-center gap-2">
					<Input
						value={newColumn}
						onChange={(e) => setNewColumn(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleAddColumn();
							}
						}}
						placeholder={m.proc_matrix_add_column_placeholder()}
						className="flex-1"
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleAddColumn}
						disabled={!newColumn.trim()}
						className="cursor-pointer"
					>
						{m.proc_field_add()}
					</Button>
				</div>
			</div>
		</div>
	);
}

interface TextConfigEditorProps {
	config: TextConfig;
	onUpdate: (config: TextConfig) => void;
}

function TextConfigEditor({ config, onUpdate }: TextConfigEditorProps) {
	return (
		<div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
			<Label className="text-xs font-medium">{m.proc_text_settings()}</Label>

			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-1.5">
					<Label htmlFor="text-min-rows" className="text-xs">
						{m.proc_text_min_rows()}
					</Label>
					<Input
						id="text-min-rows"
						type="number"
						min={1}
						max={config.max_rows || 20}
						value={config.min_rows || 3}
						onChange={(e) =>
							onUpdate({
								...config,
								min_rows: parseInt(e.target.value, 10) || 3,
							})
						}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="text-max-rows" className="text-xs">
						{m.proc_text_max_rows()}
					</Label>
					<Input
						id="text-max-rows"
						type="number"
						min={config.min_rows || 1}
						max={30}
						value={config.max_rows || 10}
						onChange={(e) =>
							onUpdate({
								...config,
								max_rows: parseInt(e.target.value, 10) || 10,
							})
						}
					/>
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="text-max-length" className="text-xs">
					{m.proc_text_max_length()}
				</Label>
				<Input
					id="text-max-length"
					type="number"
					min={0}
					value={config.max_length || ""}
					onChange={(e) =>
						onUpdate({
							...config,
							max_length: e.target.value
								? parseInt(e.target.value, 10)
								: undefined,
						})
					}
					placeholder={m.proc_text_no_limit()}
				/>
			</div>
		</div>
	);
}

export default FieldSettings;
