import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { DeviceMobileIcon } from "@phosphor-icons/react/dist/csr/DeviceMobile";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
	canInstall,
	isIos,
	isStandalone,
	promptInstall,
	subscribeInstallPrompt,
} from "@/lib/pwa/install";
import * as m from "@/paraglide/messages";

const serverSnapshot = () => false;

export function InstallApp() {
	const installable = useSyncExternalStore(
		subscribeInstallPrompt,
		canInstall,
		serverSnapshot,
	);
	const installed = useSyncExternalStore(
		subscribeInstallPrompt,
		isStandalone,
		serverSnapshot,
	);
	const ios = useSyncExternalStore(
		subscribeInstallPrompt,
		isIos,
		serverSnapshot,
	);

	if (installed) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<CheckCircleIcon className="size-4 text-primary" weight="fill" />
				{m.pwa_installed()}
			</div>
		);
	}

	if (installable) {
		return (
			<div className="flex flex-col gap-3">
				<p className="text-sm text-muted-foreground">{m.pwa_description()}</p>
				<Button
					type="button"
					variant="outline"
					className="w-fit gap-2"
					onClick={() => promptInstall()}
				>
					<DeviceMobileIcon className="size-4" weight="duotone" />
					{m.pwa_button_install()}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm text-muted-foreground">{m.pwa_description()}</p>
			<p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground ring-1 ring-border">
				{ios ? m.pwa_hint_ios() : m.pwa_hint_desktop()}
			</p>
		</div>
	);
}
