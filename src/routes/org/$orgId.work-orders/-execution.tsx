import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FlagCheckeredIcon } from "@phosphor-icons/react/dist/csr/FlagCheckered";
import { HardDriveIcon } from "@phosphor-icons/react/dist/csr/HardDrive";
import { HourglassIcon } from "@phosphor-icons/react/dist/csr/Hourglass";
import { PlayIcon } from "@phosphor-icons/react/dist/csr/Play";
import type { ReactNode } from "react";
import {
	PLACEHOLDER,
	ProcedureResponseCard,
} from "@/components/shared/work-order/procedure-responses";
import { ReportShare } from "@/components/shared/work-order/report-share";
import { buttonVariants } from "@/components/ui/button";
import { PanelDetailSection } from "@/components/ui/panel-layout";
import {
	useUpdateWorkOrderAssetProcedureMutation,
	useUpdateWorkOrderProcedureMutation,
} from "@/lib/queries/work-orders";
import * as m from "@/paraglide/messages";
import type {
	ProcedureResponses,
	WorkOrderResponse,
} from "@/server/domains/workorders/schema";
import { durationBetween } from "@/utils/day";
import { formatDate } from "@/utils/format-date";

type WorkOrder = WorkOrderResponse;
type ProcedureItem = WorkOrder["procedures"][number];

function formatTiming(value: string | null | undefined): string {
	if (!value) return PLACEHOLDER;
	return formatDate(value, { style: "medium", includeTime: true });
}

function TimingRow({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0">
			<span className="flex items-center gap-2 text-xs text-muted-foreground">
				{icon}
				{label}
			</span>
			<span className="text-sm text-muted-foreground">{value}</span>
		</div>
	);
}

function getResponses(item: ProcedureItem): ProcedureResponses {
	return item.procedure_responses ?? {};
}

export function WorkOrderExecution({
	workOrder,
	orgId,
}: {
	workOrder: WorkOrder;
	orgId: string;
}) {
	const updateProcedure = useUpdateWorkOrderProcedureMutation(
		orgId,
		workOrder.id,
	);
	const updateAssetProcedure = useUpdateWorkOrderAssetProcedureMutation(
		orgId,
		workOrder.id,
	);
	const procedures = workOrder.procedures ?? [];
	const assetsWithProcedures = (workOrder.assets ?? []).filter(
		(asset) => (asset.procedures ?? []).length > 0,
	);
	const hasResponses = procedures.length > 0 || assetsWithProcedures.length > 0;

	return (
		<div className="space-y-8">
			<PanelDetailSection title={m.wo_exec_section_execution()}>
				<div className="space-y-4">
					<div className="rounded-lg border bg-card px-4 py-1">
						<TimingRow
							icon={<CalendarBlankIcon className="size-3.5" weight="duotone" />}
							label={m.wo_field_planned_start()}
							value={formatTiming(workOrder.planned_start)}
						/>
						<TimingRow
							icon={<CalendarBlankIcon className="size-3.5" weight="duotone" />}
							label={m.wo_field_planned_end()}
							value={formatTiming(workOrder.planned_end)}
						/>
						<TimingRow
							icon={<HourglassIcon className="size-3.5" weight="duotone" />}
							label={m.wo_exec_planned_duration()}
							value={
								durationBetween(
									workOrder.planned_start,
									workOrder.planned_end,
								) ?? PLACEHOLDER
							}
						/>
						<TimingRow
							icon={<PlayIcon className="size-3.5" weight="duotone" />}
							label={m.wo_exec_started()}
							value={formatTiming(workOrder.started_at)}
						/>
						<TimingRow
							icon={<FlagCheckeredIcon className="size-3.5" weight="duotone" />}
							label={m.wo_exec_finished()}
							value={formatTiming(workOrder.closed_at)}
						/>
						<TimingRow
							icon={<HourglassIcon className="size-3.5" weight="duotone" />}
							label={m.wo_exec_execution_duration()}
							value={
								durationBetween(workOrder.started_at, workOrder.closed_at) ??
								PLACEHOLDER
							}
						/>
					</div>

					{workOrder.report_url && (
						<div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
							<div className="min-w-0">
								<div className="text-sm font-medium">
									{m.wo_exec_report_title()}
								</div>
								{workOrder.report_generated_at && (
									<div className="text-xs text-muted-foreground mt-0.5">
										{m.wo_exec_report_generated({
											date: formatDate(workOrder.report_generated_at, {
												style: "medium",
												includeTime: true,
											}),
										})}
									</div>
								)}
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<ReportShare
									workOrderId={workOrder.id}
									reportUrl={workOrder.report_url}
								/>
								<a
									href={workOrder.report_url}
									download
									target="_blank"
									rel="noreferrer"
									className={buttonVariants({ variant: "outline", size: "sm" })}
								>
									<DownloadSimpleIcon className="size-4" />
									{m.wo_exec_download()}
								</a>
							</div>
						</div>
					)}
				</div>
			</PanelDetailSection>

			{procedures.length > 0 && (
				<PanelDetailSection title={m.wo_exec_section_procedure_responses()}>
					<div className="space-y-4">
						{procedures.map((procedure) => (
							<ProcedureResponseCard
								key={procedure.id}
								orgId={orgId}
								procedureId={procedure.id}
								name={procedure.name}
								responses={getResponses(procedure)}
								isSaving={updateProcedure.isPending}
								onSave={(procedureResponses) =>
									updateProcedure.mutate({
										procedureId: procedure.id,
										procedureResponses,
									})
								}
							/>
						))}
					</div>
				</PanelDetailSection>
			)}

			{assetsWithProcedures.length > 0 && (
				<PanelDetailSection title={m.wo_exec_section_asset_procedures()}>
					<div className="space-y-5">
						{assetsWithProcedures.map((asset) => (
							<div key={asset.id} className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="size-7 rounded bg-muted flex items-center justify-center shrink-0">
										<HardDriveIcon className="size-4 text-muted-foreground" />
									</div>
									<div className="min-w-0">
										<div className="text-sm font-medium truncate">
											{asset.name}
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{asset.serial_number}
										</div>
									</div>
								</div>
								<div className="space-y-3 pl-9">
									{(asset.procedures ?? []).map((procedure) => (
										<ProcedureResponseCard
											key={procedure.id}
											orgId={orgId}
											procedureId={procedure.id}
											name={procedure.name}
											responses={getResponses(procedure)}
											isSaving={updateAssetProcedure.isPending}
											onSave={(procedureResponses) =>
												updateAssetProcedure.mutate({
													assetId: asset.id,
													procedureId: procedure.id,
													procedureResponses,
												})
											}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				</PanelDetailSection>
			)}

			{!hasResponses && (
				<p className="text-sm text-muted-foreground">{m.wo_exec_empty()}</p>
			)}
		</div>
	);
}
