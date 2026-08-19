import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "massa-theme";

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") return "system";
		return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
	});

	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
		if (theme === "system") return getSystemTheme();
		return theme;
	});

	useEffect(() => {
		const root = window.document.documentElement;

		const applyTheme = (newTheme: Theme) => {
			const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
			setResolvedTheme(resolved);

			root.classList.remove("light", "dark");
			root.classList.add(resolved);
		};

		applyTheme(theme);

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			if (theme === "system") {
				applyTheme("system");
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [theme]);

	const setTheme = (newTheme: Theme) => {
		localStorage.setItem(STORAGE_KEY, newTheme);
		setThemeState(newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
