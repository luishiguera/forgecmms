import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { meQueryOptions, useUpdateProfileMutation } from "@/lib/queries/user";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";

const STORAGE_KEY = "timezone_notice_dismissed";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function readDevice() {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function readDismissed() {
	try {
		return window.localStorage.getItem(STORAGE_KEY) ?? "";
	} catch {
		return "";
	}
}

function serverSnapshot() {
	return "";
}

function dismiss(pair: string) {
	try {
		window.localStorage.setItem(STORAGE_KEY, pair);
	} finally {
		for (const listener of listeners) listener();
	}
}

interface TimezoneNoticeProps {
	className?: string;
}

export function TimezoneNotice({ className }: TimezoneNoticeProps) {
	const { data: me } = useQuery(meQueryOptions());
	const device = useSyncExternalStore(subscribe, readDevice, serverSnapshot);
	const dismissed = useSyncExternalStore(
		subscribe,
		readDismissed,
		serverSnapshot,
	);
	const updateProfile = useUpdateProfileMutation();

	const profileTimezone = me?.timezone;
	if (!device || !profileTimezone || device === profileTimezone) return null;

	const pair = `${profileTimezone}|${device}`;
	if (dismissed === pair) return null;

	return (
		<Alert className={cn("flex flex-wrap items-center gap-2", className)}>
			<ClockIcon className="size-4 shrink-0" weight="duotone" />
			<div className="min-w-0 flex-1">
				<AlertTitle>{m.timezone_notice_title()}</AlertTitle>
				<AlertDescription>
					{m.timezone_notice_description({
						profile: profileTimezone,
						device,
					})}
				</AlertDescription>
			</div>
			<Button
				variant="outline"
				size="sm"
				className="shrink-0"
				disabled={updateProfile.isPending}
				onClick={() => updateProfile.mutate({ timezone: device })}
			>
				{m.timezone_notice_use_device({ device })}
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="shrink-0 size-7"
				aria-label={m.timezone_notice_dismiss()}
				onClick={() => dismiss(pair)}
			>
				<XIcon className="size-4" />
			</Button>
		</Alert>
	);
}
