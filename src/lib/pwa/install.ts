type InstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | undefined;
const listeners = new Set<() => void>();

const emit = () => {
	for (const listener of listeners) listener();
};

export const watchInstallPrompt = () => {
	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		deferred = event as InstallPromptEvent;
		emit();
	});

	window.addEventListener("appinstalled", () => {
		deferred = undefined;
		emit();
	});
};

export const subscribeInstallPrompt = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export const canInstall = () => deferred !== undefined;

export const promptInstall = async () => {
	const event = deferred;
	if (!event) return false;

	await event.prompt();
	const { outcome } = await event.userChoice;
	deferred = undefined;
	emit();
	return outcome === "accepted";
};

export const isStandalone = () =>
	window.matchMedia("(display-mode: standalone)").matches ||
	"standalone" in navigator;

export const isIos = () =>
	/iphone|ipad|ipod/i.test(navigator.userAgent) ||
	(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
