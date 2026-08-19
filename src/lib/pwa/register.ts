export const registerServiceWorker = () => {
	if (import.meta.env.DEV) return;
	if (!("serviceWorker" in navigator)) return;

	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
	});
};
