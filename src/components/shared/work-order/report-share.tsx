import { ShareNetworkIcon } from "@phosphor-icons/react/dist/csr/ShareNetwork";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import * as m from "@/paraglide/messages";

const canShareFiles = () =>
	typeof navigator !== "undefined" &&
	typeof navigator.canShare === "function" &&
	typeof navigator.share === "function";

export function ReportShare({
	workOrderId,
	reportUrl,
}: {
	workOrderId: number;
	reportUrl: string;
}) {
	const [isPreparing, setIsPreparing] = useState(false);

	if (!canShareFiles()) return null;

	const share = async () => {
		setIsPreparing(true);
		try {
			const response = await fetch(reportUrl);
			if (!response.ok) throw new Error(String(response.status));

			const file = new File(
				[await response.blob()],
				`work-order-${workOrderId}.pdf`,
				{ type: "application/pdf" },
			);
			if (!navigator.canShare({ files: [file] })) {
				toast.error(m.wo_report_share_unsupported());
				return;
			}

			await navigator.share({
				files: [file],
				title: m.wo_report_share_title({ id: workOrderId }),
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;
			toast.error(m.wo_report_share_error());
		} finally {
			setIsPreparing(false);
		}
	};

	return (
		<Button type="button" variant="outline" size="sm" onClick={share}>
			{isPreparing ? (
				<Spinner className="size-4" />
			) : (
				<ShareNetworkIcon className="size-4" />
			)}
			{m.wo_report_share()}
		</Button>
	);
}
