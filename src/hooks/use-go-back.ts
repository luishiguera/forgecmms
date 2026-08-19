import { useRouter } from "@tanstack/react-router";

export function useGoBack(fallback: () => void) {
	const router = useRouter();

	return () => {
		if (router.history.canGoBack()) {
			router.history.back();
			return;
		}
		fallback();
	};
}
