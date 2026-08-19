import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { XCircleIcon } from "@phosphor-icons/react/dist/csr/XCircle";
import { Spinner } from "@/components/ui/spinner";
import type { FieldStatus } from "@/hooks/use-auto-save";

interface FieldStatusIndicatorProps {
	status: FieldStatus;
}

export function FieldStatusIndicator({ status }: FieldStatusIndicatorProps) {
	if (status === "idle") return null;

	if (status === "saving") {
		return <Spinner className="size-3.5" />;
	}

	if (status === "success") {
		return (
			<CheckCircleIcon className="size-3.5 text-green-500" weight="fill" />
		);
	}

	if (status === "error") {
		return <XCircleIcon className="size-3.5 text-destructive" weight="fill" />;
	}

	return null;
}
