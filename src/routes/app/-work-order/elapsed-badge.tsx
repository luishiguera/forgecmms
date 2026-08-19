import { PauseIcon } from "@phosphor-icons/react/dist/csr/Pause";
import { PlayIcon } from "@phosphor-icons/react/dist/csr/Play";
import { TimerIcon } from "@phosphor-icons/react/dist/csr/Timer";
import { cn } from "@/lib/utils";
import { formatElapsed } from "@/lib/work-orders/timer-store";
import {
	adoptTimer,
	pauseTimer,
	startTimer,
	useWorkOrderTimer,
} from "@/lib/work-orders/use-timer";
import * as m from "@/paraglide/messages";

export function ElapsedBadge({
	workOrderId,
	startedAt,
}: {
	workOrderId: number;
	startedAt: string | null;
}) {
	const { elapsed, isRunning, hasRun } = useWorkOrderTimer(
		workOrderId,
		startedAt,
	);
	const isCounting = isRunning || (!hasRun && !!startedAt);

	const toggle = () => {
		if (!isCounting) {
			startTimer(workOrderId);
			return;
		}
		if (!hasRun && startedAt) adoptTimer(workOrderId, startedAt);
		pauseTimer(workOrderId);
	};

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={isCounting ? m.wo_timer_pause() : m.wo_timer_start()}
			className="ml-auto flex items-center gap-1.5 rounded-md bg-muted py-1 pr-1 pl-2"
		>
			<TimerIcon
				className={cn(
					"size-4",
					isCounting ? "text-primary" : "text-muted-foreground",
				)}
				weight="duotone"
			/>
			<span
				className={cn(
					"font-mono text-[13px] font-semibold tabular-nums",
					!isCounting && "text-muted-foreground",
				)}
			>
				{formatElapsed(elapsed)}
			</span>
			<span className="flex size-6 items-center justify-center rounded bg-background text-primary">
				{isCounting ? (
					<PauseIcon className="size-3.5" weight="fill" />
				) : (
					<PlayIcon className="size-3.5" weight="fill" />
				)}
			</span>
		</button>
	);
}
