import {
	type BaseFieldProps,
	SelectField,
} from "@/components/shared/form-fields";
import * as m from "@/paraglide/messages";
import {
	getAssignmentStatusOptions,
	getCriticalityOptions,
	getStatusOptions,
} from "./-types";

interface FieldProps extends BaseFieldProps {
	required?: boolean;
}

export function StatusSelectField(props: FieldProps) {
	return (
		<SelectField
			{...props}
			name="status"
			label={m.assets_field_status()}
			options={getStatusOptions()}
		/>
	);
}

export function CriticalitySelectField(props: FieldProps) {
	return (
		<SelectField
			{...props}
			name="criticality"
			label={m.assets_field_criticality()}
			options={getCriticalityOptions()}
		/>
	);
}

export function AssignmentStatusSelectField(
	props: Omit<FieldProps, "required">,
) {
	return (
		<SelectField
			{...props}
			name="assignment_status"
			label={m.assets_field_assignment_status()}
			options={getAssignmentStatusOptions()}
		/>
	);
}
