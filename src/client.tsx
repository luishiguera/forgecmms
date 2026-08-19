import { StartClient } from "@tanstack/react-start/client";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { watchInstallPrompt } from "./lib/pwa/install";
import { registerServiceWorker } from "./lib/pwa/register";

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<StartClient />
		</StrictMode>,
	);
});

watchInstallPrompt();
registerServiceWorker();
