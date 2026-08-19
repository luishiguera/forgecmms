import type { ReactNode } from "react";
import { TimezoneNotice } from "@/components/shared/timezone-notice";

export function FieldLayout({ children }: { children: ReactNode }) {
	return (
		<div
			data-surface="field"
			className="flex h-dvh flex-col overflow-hidden bg-background"
		>
			<div className="mx-auto flex w-full max-w-2xl flex-1 min-h-0 flex-col">
				<TimezoneNotice className="shrink-0 rounded-none border-x-0 border-t-0 px-3 py-2" />
				<div className="flex flex-1 min-h-0 flex-col">{children}</div>
			</div>
		</div>
	);
}
