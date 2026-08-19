import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { FieldSheet } from "@/components/field/field-sheet";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import type { ScheduleBlockType } from "@/server/domains/schedule/schema";
import { durationLabel, timeLabel, wallToInstant } from "@/utils/day";
import { BLOCK_TYPE_CONFIG, blockTypeLabel } from "./types";

const TYPES: ScheduleBlockType[] = ["break", "travel", "meeting", "block"];
const DURATIONS = [30, 60, 90, 120];

const toMinutes = (value: string) => {
	const [hours, minutes] = value.split(":");
	return Number(hours) * 60 + Number(minutes);
};

export function CreateBlockSheet({
	open,
	day,
	timezone,
	isSaving,
	onOpenChange,
	onSubmit,
}: {
	open: boolean;
	day: string;
	timezone: string;
	isSaving: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: {
		type: ScheduleBlockType;
		note: string;
		start_time: string;
		end_time: string;
	}) => void;
}) {
	const [type, setType] = useState<ScheduleBlockType>("break");
	const [duration, setDuration] = useState(60);

	const form = useForm({
		defaultValues: { note: "", start: "09:00" },
		onSubmit: ({ value }) => {
			const startMinutes = toMinutes(value.start);
			onSubmit({
				type,
				note: value.note.trim(),
				start_time: wallToInstant(day, startMinutes, timezone).toISOString(),
				end_time: wallToInstant(
					day,
					startMinutes + duration,
					timezone,
				).toISOString(),
			});
		},
	});

	return (
		<FieldSheet
			open={open}
			title={m.agenda_new_block()}
			onOpenChange={onOpenChange}
		>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
				className="flex min-h-0 flex-col overflow-hidden"
			>
				<div className="flex flex-col gap-4 overflow-y-auto p-6">
					<div className="flex flex-wrap gap-2">
						{TYPES.map((option) => {
							const config = BLOCK_TYPE_CONFIG[option];
							const Icon = config.icon;
							const isSelected = option === type;
							return (
								<button
									key={option}
									type="button"
									onClick={() => setType(option)}
									className={cn(
										"flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-medium ring-1",
										isSelected
											? cn(config.tint, config.accent, "ring-current")
											: "bg-muted text-muted-foreground ring-border",
									)}
								>
									<Icon className="size-4" />
									{blockTypeLabel(option)}
								</button>
							);
						})}
					</div>

					<form.Field
						name="note"
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>
									{m.agenda_field_note()}
								</FieldLabel>
								<Input
									id={field.name}
									value={field.state.value}
									placeholder={blockTypeLabel(type)}
									maxLength={200}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
							</Field>
						)}
					/>

					<form.Field
						name="start"
						children={(field) => (
							<div className="flex items-center gap-2.5 rounded-[10px] px-4 py-3 ring-1 ring-border">
								<ClockIcon className="size-[18px] shrink-0 text-muted-foreground" />
								<span className="text-sm font-medium">
									{m.agenda_start_end({
										start: timeLabel(
											wallToInstant(
												day,
												toMinutes(field.state.value),
												timezone,
											),
											timezone,
										),
										end: timeLabel(
											wallToInstant(
												day,
												toMinutes(field.state.value) + duration,
												timezone,
											),
											timezone,
										),
									})}
								</span>
								<Input
									aria-label={m.agenda_field_start()}
									type="time"
									className="ml-auto w-fit"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
							</div>
						)}
					/>

					<div className="flex flex-wrap gap-2">
						{DURATIONS.map((minutes) => {
							const isSelected = minutes === duration;
							return (
								<button
									key={minutes}
									type="button"
									onClick={() => setDuration(minutes)}
									className={cn(
										"rounded-lg px-3.5 py-2 text-[13px] font-medium ring-1",
										isSelected
											? "bg-primary/10 text-primary ring-primary"
											: "bg-muted text-muted-foreground ring-border",
									)}
								>
									{durationLabel(minutes)}
								</button>
							);
						})}
					</div>

					<Button type="submit" size="xl" disabled={isSaving}>
						{isSaving ? <Spinner /> : m.agenda_add_block()}
					</Button>
				</div>
			</form>
		</FieldSheet>
	);
}
