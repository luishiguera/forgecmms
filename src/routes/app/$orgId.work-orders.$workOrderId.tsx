import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CubeIcon } from "@phosphor-icons/react/dist/csr/Cube";
import { FilePdfIcon } from "@phosphor-icons/react/dist/csr/FilePdf";
import { FlagIcon } from "@phosphor-icons/react/dist/csr/Flag";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PhoneIcon } from "@phosphor-icons/react/dist/csr/Phone";
import { PlayCircleIcon } from "@phosphor-icons/react/dist/csr/PlayCircle";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { ProhibitIcon } from "@phosphor-icons/react/dist/csr/Prohibit";
import { TimerIcon } from "@phosphor-icons/react/dist/csr/Timer";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { WrenchIcon } from "@phosphor-icons/react/dist/csr/Wrench";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FieldAppBar } from "@/components/field/app-bar";
import { ConfirmSheet } from "@/components/field/confirm-sheet";
import {
	AddItemCard,
	EmptyStateCard,
	InfoRow,
	RelatedItem,
	SectionHeader,
} from "@/components/field/detail-widgets";
import type { Responses } from "@/components/procedure-runner/validation";
import { AttachmentSections } from "@/components/shared/attachment-sections";
import { ReportShare } from "@/components/shared/work-order/report-share";
import {
	PriorityBadge,
	StatusBadge,
} from "@/components/shared/work-order-badges";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGoBack } from "@/hooks/use-go-back";
import { procedureQueryOptions } from "@/lib/queries/procedures";
import {
	useCreateWorkOrderAssetMutation,
	useCreateWorkOrderAssetProcedureMutation,
	useCreateWorkOrderAssigneeMutation,
	useCreateWorkOrderPartMutation,
	useCreateWorkOrderProcedureMutation,
	useDeleteWorkOrderAssetMutation,
	useDeleteWorkOrderAssetProcedureMutation,
	useDeleteWorkOrderAssigneeMutation,
	useDeleteWorkOrderPartMutation,
	useDeleteWorkOrderProcedureMutation,
	useUpdateWorkOrderAssetProcedureMutation,
	useUpdateWorkOrderMutation,
	useUpdateWorkOrderPartMutation,
	useUpdateWorkOrderProcedureMutation,
	workOrderQueryOptions,
} from "@/lib/queries/work-orders";
import { cn } from "@/lib/utils";
import { getTypeLabel } from "@/lib/work-orders/labels";
import { procedureStatus } from "@/lib/work-orders/procedure-status";
import { timingDelta } from "@/lib/work-orders/timing";
import { pauseTimer, startTimer } from "@/lib/work-orders/use-timer";
import * as m from "@/paraglide/messages";
import { isFieldBlock } from "@/server/domains/procedures/schema";
import type { WorkOrderPartItemResponse } from "@/server/domains/workorders/schema";
import { durationBetween } from "@/utils/day";
import { formatDate } from "@/utils/format-date";
import {
	AddAssetsSheet,
	AddAssigneesSheet,
	AddLocationSheet,
	AddPartsSheet,
	AddProceduresSheet,
} from "./-work-order/add-sheets";
import { CancelSheet } from "./-work-order/cancel-sheet";
import { CompleteSheet } from "./-work-order/complete-sheet";
import { ElapsedBadge } from "./-work-order/elapsed-badge";
import { PartConsumptionSheet } from "./-work-order/part-consumption-sheet";
import { ProcedureCard } from "./-work-order/procedure-card";
import { ProcedureSheet } from "./-work-order/procedure-sheet";

export const Route = createFileRoute("/app/$orgId/work-orders/$workOrderId")({
	component: RouteComponent,
});

type SheetName =
	| "assets"
	| "parts"
	| "procedures"
	| "assignees"
	| "location"
	| "cancel"
	| "complete";

type ProcedureTarget = {
	key: string;
	procedureId: number;
	name: string;
	responses: Responses;
	assetId?: number;
};

type RemoveTarget = {
	title: string;
	message: string;
	run: () => void;
};

const formatTiming = (value: string | null) =>
	value ? formatDate(value, { style: "medium", includeTime: true }) : null;

const mapsUrl = (latitude?: number | null, longitude?: number | null) =>
	latitude == null || longitude == null
		? undefined
		: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

function RouteComponent() {
	const { orgId, workOrderId } = Route.useParams();
	const id = Number(workOrderId);
	const navigate = useNavigate();
	const goBack = useGoBack(() =>
		navigate({ to: "/app/$orgId", params: { orgId } }),
	);

	const [sheet, setSheet] = useState<SheetName | null>(null);
	const [sheetEpoch, setSheetEpoch] = useState(0);
	const [assetForProcedure, setAssetForProcedure] = useState<number | null>(
		null,
	);
	const [partTarget, setPartTarget] =
		useState<WorkOrderPartItemResponse | null>(null);
	const [procedureTarget, setProcedureTarget] =
		useState<ProcedureTarget | null>(null);
	const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
	const [flagged, setFlagged] = useState<string[]>([]);

	const {
		data: workOrder,
		isPending,
		isError,
		refetch,
	} = useQuery(workOrderQueryOptions(orgId, id));

	const update = useUpdateWorkOrderMutation(orgId);
	const addAsset = useCreateWorkOrderAssetMutation(orgId, id);
	const removeAsset = useDeleteWorkOrderAssetMutation(orgId, id);
	const addPart = useCreateWorkOrderPartMutation(orgId, id);
	const updatePart = useUpdateWorkOrderPartMutation(orgId, id);
	const removePart = useDeleteWorkOrderPartMutation(orgId, id);
	const addAssignee = useCreateWorkOrderAssigneeMutation(orgId, id);
	const removeAssignee = useDeleteWorkOrderAssigneeMutation(orgId, id);
	const addProcedure = useCreateWorkOrderProcedureMutation(orgId, id);
	const updateProcedure = useUpdateWorkOrderProcedureMutation(orgId, id);
	const removeProcedure = useDeleteWorkOrderProcedureMutation(orgId, id);
	const addAssetProcedure = useCreateWorkOrderAssetProcedureMutation(orgId, id);
	const updateAssetProcedure = useUpdateWorkOrderAssetProcedureMutation(
		orgId,
		id,
	);
	const removeAssetProcedure = useDeleteWorkOrderAssetProcedureMutation(
		orgId,
		id,
	);

	const procedureItems: ProcedureTarget[] = [
		...(workOrder?.procedures ?? []).map((procedure) => ({
			key: `proc_${procedure.id}`,
			procedureId: procedure.id,
			name: procedure.name,
			responses: procedure.procedure_responses ?? {},
		})),
		...(workOrder?.assets ?? []).flatMap((asset) =>
			(asset.procedures ?? []).map((procedure) => ({
				key: `asset_${asset.id}_proc_${procedure.id}`,
				procedureId: procedure.id,
				name: `${asset.name} - ${procedure.name}`,
				responses: procedure.procedure_responses ?? {},
				assetId: asset.id,
			})),
		),
	];

	const definitions = useQueries({
		queries: procedureItems.map((item) =>
			procedureQueryOptions(orgId, item.procedureId),
		),
	});

	const statusOf = (item: ProcedureTarget) => {
		const index = procedureItems.findIndex((entry) => entry.key === item.key);
		const fields = (definitions[index]?.data?.fields ?? []).filter(
			isFieldBlock,
		);
		return procedureStatus(fields, item.responses, flagged.includes(item.key));
	};

	const openSheet = (next: SheetName) => {
		setSheetEpoch((epoch) => epoch + 1);
		setSheet(next);
	};

	const closeSheet = () => setSheet(null);

	if (isPending) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Spinner className="size-8 text-primary" />
			</div>
		);
	}

	if (isError || !workOrder) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center px-12 text-center">
				<WarningCircleIcon className="size-12 text-muted-foreground" />
				<p className="mt-4 text-sm text-muted-foreground">{m.agenda_error()}</p>
				<Button
					type="button"
					variant="outline"
					className="mt-4"
					onClick={() => refetch()}
				>
					{m.agenda_retry()}
				</Button>
			</div>
		);
	}

	const isFinal =
		workOrder.status === "completed" || workOrder.status === "cancelled";
	const unusedParts = workOrder.parts.filter(
		(part) => part.used_quantity === 0,
	);
	const startDelta = timingDelta(workOrder.planned_start, workOrder.started_at);
	const endDelta = timingDelta(workOrder.planned_end, workOrder.closed_at);
	const totalDuration = durationBetween(
		workOrder.started_at,
		workOrder.closed_at,
	);
	const locationPhone = workOrder.location?.phones?.[0]?.number;

	const startWorkOrder = () => {
		update.mutate(
			{ workOrderId: id, data: { status: "in_progress" } },
			{ onSuccess: () => startTimer(id) },
		);
	};

	const requestCompletion = () => {
		const incomplete = procedureItems.filter(
			(item) => statusOf(item) !== "completed",
		);
		if (incomplete.length > 0) {
			setFlagged(incomplete.map((item) => item.key));
			toast.error(
				m.wo_incomplete_procedures({
					procedures: incomplete.map((item) => item.name).join(", "),
				}),
			);
			return;
		}
		openSheet("complete");
	};

	const completeWorkOrder = () => {
		update.mutate(
			{ workOrderId: id, data: { status: "completed" } },
			{
				onSuccess: () => {
					pauseTimer(id);
					closeSheet();
					toast.success(m.wo_completed_toast());
				},
			},
		);
	};

	const cancelWorkOrder = (reason: string) => {
		update.mutate(
			{
				workOrderId: id,
				data: { status: "cancelled", cancellation_reason: reason },
			},
			{
				onSuccess: () => {
					pauseTimer(id);
					closeSheet();
				},
			},
		);
	};

	const confirmRemoval = (name: string, run: () => void, title: string) =>
		setRemoveTarget({
			title,
			message: m.wo_remove_confirm({ name }),
			run,
		});

	return (
		<div className="flex flex-1 min-h-0 flex-col">
			<FieldAppBar
				title={`#${workOrder.id}`}
				onBack={goBack}
				onRefresh={() => refetch()}
			/>

			<div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-6 pt-2 pb-10">
				<div>
					<h1 className="text-[22px] font-bold tracking-[-0.5px]">
						{workOrder.title}
					</h1>
					<p className="mt-1 text-xs font-medium text-muted-foreground">
						{m.wo_field_description()}
					</p>
					<p
						className={cn(
							"mt-0.5 text-sm leading-[1.4]",
							!workOrder.description && "text-muted-foreground italic",
						)}
					>
						{workOrder.description || m.wo_no_description()}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<StatusBadge status={workOrder.status} />
					<PriorityBadge priority={workOrder.priority} />
					{workOrder.status === "in_progress" && (
						<ElapsedBadge
							workOrderId={workOrder.id}
							startedAt={workOrder.started_at}
						/>
					)}
				</div>

				{workOrder.tags.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{workOrder.tags.map((tag) => (
							<span
								key={tag.id}
								className="rounded-xl bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
							>
								{tag.name}
							</span>
						))}
					</div>
				)}

				<div className="flex flex-col gap-2.5">
					<InfoRow
						icon={WrenchIcon}
						label={m.wo_field_type()}
						value={getTypeLabel(workOrder.type)}
					/>
					{formatTiming(workOrder.planned_start) && (
						<InfoRow
							icon={CalendarBlankIcon}
							label={m.wo_field_planned_start()}
							value={formatTiming(workOrder.planned_start) ?? undefined}
						/>
					)}
					{formatTiming(workOrder.planned_end) && (
						<InfoRow
							icon={CalendarBlankIcon}
							label={m.wo_field_planned_end()}
							value={formatTiming(workOrder.planned_end) ?? undefined}
						/>
					)}
					{formatTiming(workOrder.started_at) && (
						<InfoRow
							icon={PlayCircleIcon}
							label={m.wo_field_started_at()}
							value={formatTiming(workOrder.started_at) ?? undefined}
						/>
					)}
					{formatTiming(workOrder.closed_at) && (
						<InfoRow
							icon={CheckCircleIcon}
							label={m.wo_field_closed_at()}
							value={formatTiming(workOrder.closed_at) ?? undefined}
						/>
					)}
					{workOrder.status === "cancelled" &&
						workOrder.cancellation_reason && (
							<InfoRow
								icon={ProhibitIcon}
								label={m.wo_cancellation_reason()}
								value={workOrder.cancellation_reason}
							/>
						)}
				</div>

				{(totalDuration || startDelta || endDelta) && (
					<div className="flex flex-col gap-2.5">
						<SectionHeader title={m.wo_section_timing()} />
						{totalDuration && (
							<InfoRow
								icon={TimerIcon}
								label={m.wo_timing_total()}
								value={totalDuration}
							/>
						)}
						{startDelta && (
							<InfoRow
								icon={PlayCircleIcon}
								label={m.wo_timing_start()}
								value={
									startDelta.kind === "on_time"
										? m.wo_timing_started_on_time()
										: startDelta.kind === "early"
											? m.wo_timing_started_early({ time: startDelta.duration })
											: m.wo_timing_started_late({ time: startDelta.duration })
								}
							/>
						)}
						{endDelta && (
							<InfoRow
								icon={FlagIcon}
								label={m.wo_timing_end()}
								value={
									endDelta.kind === "on_time"
										? m.wo_timing_finished_on_time()
										: endDelta.kind === "early"
											? m.wo_timing_finished_early({ time: endDelta.duration })
											: m.wo_timing_finished_late({ time: endDelta.duration })
								}
							/>
						)}
					</div>
				)}

				{workOrder.report_url && (
					<div className="flex flex-col gap-2">
						<SectionHeader title={m.wo_section_report()} />
						<div className="flex items-center gap-3 rounded-lg p-3 ring-1 ring-border">
							<FilePdfIcon className="size-[18px] shrink-0 text-muted-foreground" />
							<a
								href={workOrder.report_url}
								target="_blank"
								rel="noreferrer"
								className="min-w-0 flex-1"
							>
								<span className="block truncate text-[13px] font-medium">
									{m.wo_report_file()}
								</span>
								{workOrder.report_generated_at && (
									<span className="block text-[11px] text-muted-foreground">
										{formatTiming(workOrder.report_generated_at)}
									</span>
								)}
							</a>
							<ReportShare
								workOrderId={workOrder.id}
								reportUrl={workOrder.report_url}
							/>
						</div>
					</div>
				)}

				<div className="flex flex-col gap-2.5">
					<SectionHeader title={m.wo_section_procedures()} />
					{(workOrder.procedures ?? []).map((procedure) => {
						const item = procedureItems.find(
							(entry) => entry.key === `proc_${procedure.id}`,
						);
						if (!item) return null;
						return (
							<ProcedureCard
								key={procedure.id}
								name={procedure.name}
								description={procedure.description}
								status={statusOf(item)}
								onOpen={() => setProcedureTarget(item)}
								onRemove={() =>
									confirmRemoval(
										procedure.name,
										() => removeProcedure.mutate(procedure.id),
										m.wo_remove_procedure(),
									)
								}
							/>
						);
					})}
					{workOrder.procedures.length === 0 && (
						<EmptyStateCard
							icon={WarningCircleIcon}
							label={m.wo_empty_procedures()}
						/>
					)}
					{!isFinal && (
						<AddItemCard
							icon={PlusIcon}
							label={m.wo_add_procedures()}
							onClick={() => {
								setAssetForProcedure(null);
								openSheet("procedures");
							}}
						/>
					)}
				</div>

				<div className="flex flex-col gap-2.5">
					<SectionHeader title={m.wo_section_location()} />
					{workOrder.location ? (
						<RelatedItem
							icon={MapPinIcon}
							title={workOrder.location.name}
							subtitle={workOrder.location.address}
							imageUrl={workOrder.location.image_url}
							href={mapsUrl(
								workOrder.location.latitude,
								workOrder.location.longitude,
							)}
							trailing={
								<span className="flex items-center gap-1">
									{locationPhone && (
										<a
											href={`tel:${locationPhone}`}
											aria-label={locationPhone}
											className="p-1 text-muted-foreground"
										>
											<PhoneIcon className="size-[18px]" />
										</a>
									)}
									{!isFinal && (
										<button
											type="button"
											aria-label={m.wo_remove_location()}
											className="p-1 text-muted-foreground"
											onClick={() =>
												setRemoveTarget({
													title: m.wo_remove_location(),
													message: m.wo_remove_location_confirm(),
													run: () =>
														update.mutate({
															workOrderId: id,
															data: { location_id: null },
														}),
												})
											}
										>
											<XIcon className="size-[18px]" />
										</button>
									)}
								</span>
							}
						/>
					) : (
						<EmptyStateCard icon={MapPinIcon} label={m.wo_empty_location()} />
					)}
					{!isFinal && !workOrder.location && (
						<AddItemCard
							icon={PlusIcon}
							label={m.wo_add_location()}
							onClick={() => openSheet("location")}
						/>
					)}
				</div>

				<div className="flex flex-col gap-2.5">
					<SectionHeader title={m.wo_field_assets()} />
					{workOrder.assets.map((asset) => (
						<div key={asset.id} className="flex flex-col gap-2.5">
							<RelatedItem
								icon={CubeIcon}
								title={asset.name}
								subtitle={asset.serial_number}
								imageUrl={asset.image_url}
								trailing={
									!isFinal && (
										<button
											type="button"
											aria-label={m.wo_remove_asset()}
											className="p-1 text-muted-foreground"
											onClick={() =>
												confirmRemoval(
													asset.name,
													() => removeAsset.mutate(asset.id),
													m.wo_remove_asset(),
												)
											}
										>
											<XIcon className="size-[18px]" />
										</button>
									)
								}
							/>
							<div className="flex flex-col gap-2.5 pl-6">
								{(asset.procedures ?? []).map((procedure) => {
									const item = procedureItems.find(
										(entry) =>
											entry.key === `asset_${asset.id}_proc_${procedure.id}`,
									);
									if (!item) return null;
									return (
										<ProcedureCard
											key={procedure.id}
											name={procedure.name}
											description={procedure.description}
											status={statusOf(item)}
											onOpen={() => setProcedureTarget(item)}
											onRemove={() =>
												confirmRemoval(
													procedure.name,
													() =>
														removeAssetProcedure.mutate({
															assetId: asset.id,
															procedureId: procedure.id,
														}),
													m.wo_remove_procedure(),
												)
											}
										/>
									);
								})}
								{!isFinal && (
									<AddItemCard
										icon={PlusIcon}
										label={m.wo_add_procedures()}
										onClick={() => {
											setAssetForProcedure(asset.id);
											openSheet("procedures");
										}}
									/>
								)}
							</div>
						</div>
					))}
					{workOrder.assets.length === 0 && (
						<EmptyStateCard icon={CubeIcon} label={m.wo_empty_assets()} />
					)}
					{!isFinal && (
						<AddItemCard
							icon={PlusIcon}
							label={m.wo_add_assets()}
							onClick={() => openSheet("assets")}
						/>
					)}
				</div>

				<div className="flex flex-col gap-2.5">
					<SectionHeader title={m.wo_parts_label()} />
					{workOrder.parts.map((part) => (
						<RelatedItem
							key={part.id}
							icon={WrenchIcon}
							title={part.name}
							subtitle={
								<>
									<span className="block truncate">
										{`${m.wo_parts_planned()}: ${part.planned_quantity}`}
									</span>
									<span className="block truncate">
										{`${m.wo_parts_used()}: ${part.used_quantity}`}
									</span>
								</>
							}
							imageUrl={part.image_url}
							onClick={isFinal ? undefined : () => setPartTarget(part)}
							trailing={
								!isFinal && (
									<button
										type="button"
										aria-label={m.wo_remove_part()}
										className="p-1 text-muted-foreground"
										onClick={(event) => {
											event.stopPropagation();
											confirmRemoval(
												part.name,
												() => removePart.mutate(part.id),
												m.wo_remove_part(),
											);
										}}
									>
										<XIcon className="size-[18px]" />
									</button>
								)
							}
						/>
					))}
					{workOrder.parts.length === 0 && (
						<EmptyStateCard icon={WrenchIcon} label={m.wo_empty_parts()} />
					)}
					{!isFinal && (
						<AddItemCard
							icon={PlusIcon}
							label={m.wo_add_parts()}
							onClick={() => openSheet("parts")}
						/>
					)}
				</div>

				<div className="flex flex-col gap-2.5">
					<SectionHeader title={m.wo_section_assigned()} />
					{workOrder.assignees.map((assignee) => (
						<RelatedItem
							key={assignee.id}
							icon={UserIcon}
							title={assignee.full_name}
							subtitle={assignee.email}
							imageUrl={assignee.photo_url}
							trailing={
								!isFinal && (
									<button
										type="button"
										aria-label={m.wo_remove_assignee()}
										className="p-1 text-muted-foreground"
										onClick={() =>
											confirmRemoval(
												assignee.full_name,
												() => removeAssignee.mutate(assignee.id),
												m.wo_remove_assignee(),
											)
										}
									>
										<XIcon className="size-[18px]" />
									</button>
								)
							}
						/>
					))}
					{workOrder.assignees.length === 0 && (
						<EmptyStateCard icon={UserIcon} label={m.wo_empty_assignees()} />
					)}
					{!isFinal && (
						<AddItemCard
							icon={PlusIcon}
							label={m.wo_add_assignees()}
							onClick={() => openSheet("assignees")}
						/>
					)}
				</div>

				<AttachmentSections
					orgId={orgId}
					entityType="workorder"
					entityId={workOrder.id}
				/>

				{!isFinal && (
					<div className="mt-4 flex flex-col gap-3">
						<Button
							type="button"
							size="xl"
							disabled={update.isPending}
							onClick={
								workOrder.status === "in_progress"
									? requestCompletion
									: startWorkOrder
							}
						>
							{update.isPending ? (
								<Spinner />
							) : workOrder.status === "in_progress" ? (
								m.wo_mark_completed()
							) : (
								m.wo_mark_in_progress()
							)}
						</Button>
						<Button
							type="button"
							size="xl"
							variant="ghost"
							className="text-destructive hover:text-destructive"
							onClick={() => openSheet("cancel")}
						>
							{m.wo_unable_to_complete()}
						</Button>
					</div>
				)}
			</div>

			<AddAssetsSheet
				key={`assets-${sheetEpoch}`}
				orgId={orgId}
				open={sheet === "assets"}
				existingIds={workOrder.assets.map((asset) => asset.id)}
				isSaving={addAsset.isPending}
				onOpenChange={(open) => !open && closeSheet()}
				onConfirm={(ids) => {
					for (const assetId of ids) addAsset.mutate(assetId);
					closeSheet();
				}}
			/>

			<AddPartsSheet
				key={`parts-${sheetEpoch}`}
				orgId={orgId}
				open={sheet === "parts"}
				existingIds={workOrder.parts.map((part) => part.id)}
				isSaving={addPart.isPending}
				onOpenChange={(open) => !open && closeSheet()}
				onConfirm={(ids) => {
					for (const partId of ids)
						addPart.mutate({ partId, plannedQuantity: 1 });
					closeSheet();
				}}
			/>

			<AddProceduresSheet
				key={`procedures-${sheetEpoch}`}
				orgId={orgId}
				open={sheet === "procedures"}
				existingIds={
					assetForProcedure === null
						? workOrder.procedures.map((procedure) => procedure.id)
						: (
								workOrder.assets.find((asset) => asset.id === assetForProcedure)
									?.procedures ?? []
							).map((procedure) => procedure.id)
				}
				isSaving={addProcedure.isPending || addAssetProcedure.isPending}
				onOpenChange={(open) => !open && closeSheet()}
				onConfirm={(ids) => {
					for (const procedureId of ids) {
						if (assetForProcedure === null) {
							addProcedure.mutate(procedureId);
						} else {
							addAssetProcedure.mutate({
								assetId: assetForProcedure,
								procedureId,
							});
						}
					}
					closeSheet();
				}}
			/>

			<AddAssigneesSheet
				key={`assignees-${sheetEpoch}`}
				orgId={orgId}
				open={sheet === "assignees"}
				existingIds={workOrder.assignees.map((assignee) => assignee.id)}
				isSaving={addAssignee.isPending}
				onOpenChange={(open) => !open && closeSheet()}
				onConfirm={(ids) => {
					for (const userId of ids) addAssignee.mutate(userId);
					closeSheet();
				}}
			/>

			<AddLocationSheet
				key={`location-${sheetEpoch}`}
				orgId={orgId}
				open={sheet === "location"}
				isSaving={update.isPending}
				onOpenChange={(open) => !open && closeSheet()}
				onConfirm={(ids) => {
					const [locationId] = ids;
					if (locationId) {
						update.mutate({
							workOrderId: id,
							data: { location_id: locationId },
						});
					}
					closeSheet();
				}}
			/>

			<CancelSheet
				key={`cancel-${sheetEpoch}`}
				open={sheet === "cancel"}
				isSaving={update.isPending}
				onOpenChange={(open) => !open && closeSheet()}
				onConfirm={cancelWorkOrder}
			/>

			<CompleteSheet
				open={sheet === "complete"}
				unusedParts={unusedParts}
				isSaving={update.isPending}
				onOpenChange={(open) => !open && closeSheet()}
				onConfirm={completeWorkOrder}
			/>

			{partTarget && (
				<PartConsumptionSheet
					key={partTarget.id}
					open
					part={partTarget}
					isSaving={updatePart.isPending}
					onOpenChange={(open) => !open && setPartTarget(null)}
					onSave={(usedQuantity) =>
						updatePart.mutate(
							{
								partId: partTarget.id,
								plannedQuantity: partTarget.planned_quantity,
								usedQuantity,
							},
							{ onSuccess: () => setPartTarget(null) },
						)
					}
				/>
			)}

			{procedureTarget && (
				<ProcedureSheet
					key={procedureTarget.key}
					open
					orgId={orgId}
					procedureId={procedureTarget.procedureId}
					title={procedureTarget.name}
					responses={procedureTarget.responses}
					isSaving={updateProcedure.isPending || updateAssetProcedure.isPending}
					onOpenChange={(open) => !open && setProcedureTarget(null)}
					onSave={(responses) => {
						const done = () => {
							setFlagged((current) =>
								current.filter((key) => key !== procedureTarget.key),
							);
							setProcedureTarget(null);
						};
						if (procedureTarget.assetId === undefined) {
							updateProcedure.mutate(
								{
									procedureId: procedureTarget.procedureId,
									procedureResponses: responses,
								},
								{ onSuccess: done },
							);
						} else {
							updateAssetProcedure.mutate(
								{
									assetId: procedureTarget.assetId,
									procedureId: procedureTarget.procedureId,
									procedureResponses: responses,
								},
								{ onSuccess: done },
							);
						}
					}}
				/>
			)}

			{removeTarget && (
				<ConfirmSheet
					open
					title={removeTarget.title}
					message={removeTarget.message}
					confirmLabel={m.wo_button_remove()}
					onOpenChange={(open) => !open && setRemoveTarget(null)}
					onConfirm={() => {
						removeTarget.run();
						setRemoveTarget(null);
					}}
				/>
			)}
		</div>
	);
}
