import type { ReactNode } from "react";
import { PanelDetailSection } from "@/components/ui/panel-layout";
import type { FieldStatus } from "@/hooks/use-auto-save";
import * as m from "@/paraglide/messages";
import {
	DateTimeField,
	PrioritySelectField,
	StatusSelectField,
	TextareaField,
	TextField,
	TypeSelectField,
} from "./-form-fields";

type WorkOrderFormApi = any;

interface SectionProps {
	form: WorkOrderFormApi;
	onFieldChange?: (fieldName: string) => void;
	getStatus?: (fieldName: string) => FieldStatus | undefined;
}

interface BasicSectionProps extends SectionProps {
	titlePlaceholder: string;
	getFieldError?: (fieldName: string) => string | undefined;
	children?: ReactNode;
}

export function WorkOrderBasicSection({
	form,
	onFieldChange,
	getStatus,
	getFieldError,
	titlePlaceholder,
	children,
}: BasicSectionProps) {
	return (
		<PanelDetailSection title={m.wo_section_basic()}>
			<div className="space-y-4">
				<TextField
					form={form}
					name="title"
					label={m.wo_field_title()}
					placeholder={titlePlaceholder}
					onFieldChange={onFieldChange}
					status={getStatus?.("title")}
					required
					error={getFieldError?.("title")}
				/>

				<TextareaField
					form={form}
					name="description"
					label={m.wo_field_description()}
					placeholder={m.wo_placeholder_description()}
					onFieldChange={onFieldChange}
					status={getStatus?.("description")}
				/>

				<StatusSelectField
					form={form}
					onFieldChange={onFieldChange}
					status={getStatus?.("status")}
				/>

				<PrioritySelectField
					form={form}
					onFieldChange={onFieldChange}
					status={getStatus?.("priority")}
				/>

				<TypeSelectField
					form={form}
					onFieldChange={onFieldChange}
					status={getStatus?.("type")}
				/>

				{children}
			</div>
		</PanelDetailSection>
	);
}

export function WorkOrderSchedulingSection({
	form,
	onFieldChange,
	getStatus,
}: SectionProps) {
	return (
		<PanelDetailSection title={m.wo_section_scheduling()}>
			<div className="space-y-4">
				<DateTimeField
					form={form}
					name="planned_start"
					label={m.wo_field_planned_start()}
					onFieldChange={onFieldChange}
					status={getStatus?.("planned_start")}
				/>

				<DateTimeField
					form={form}
					name="planned_end"
					label={m.wo_field_planned_end()}
					onFieldChange={onFieldChange}
					status={getStatus?.("planned_end")}
				/>
			</div>
		</PanelDetailSection>
	);
}
