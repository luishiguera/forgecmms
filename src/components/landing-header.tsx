import { GlobeIcon } from "@phosphor-icons/react/dist/csr/Globe";
import { ListIcon } from "@phosphor-icons/react/dist/csr/List";
import { Link } from "@tanstack/react-router";
import { BrandWordmark } from "@/components/brand";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import { getLocale, locales, setLocale } from "@/paraglide/runtime";

const languageLabels: Record<string, string> = {
	"en-US": "English",
	es: "Español",
	"pt-BR": "Português (BR)",
};

function LangSwitcher({ className }: { className?: string }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className={cn(
					"inline-flex cursor-pointer items-center gap-1.5 text-sm transition-colors",
					className,
				)}
			>
				<GlobeIcon className="size-4" weight="duotone" />
				{languageLabels[getLocale()]}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{locales.map((locale) => (
					<DropdownMenuItem
						key={locale}
						onClick={() => setLocale(locale)}
						className={getLocale() === locale ? "bg-accent" : ""}
					>
						{languageLabels[locale]}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function MobileMenu() {
	return (
		<Sheet>
			<SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted transition-colors">
				<ListIcon className="size-5" />
				<span className="sr-only">Open menu</span>
			</SheetTrigger>
			<SheetContent side="left" showCloseButton>
				<div className="flex h-full flex-col">
					<div className="flex items-center px-4 py-3">
						<Link to="/">
							<BrandWordmark />
						</Link>
					</div>

					<div className="px-4 pt-2 pb-5 flex flex-col gap-3">
						<SheetClose>
							<Link
								to="/signup"
								className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
							>
								{m.landing_button_get_started_free()}
							</Link>
						</SheetClose>
						<SheetClose>
							<Link
								to="/login"
								className="flex w-full items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
							>
								{m.landing_button_login()}
							</Link>
						</SheetClose>
						<LangSwitcher className="text-muted-foreground hover:text-foreground" />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}

function AnnouncementBar() {
	return (
		<div className="bg-primary text-primary-foreground">
			<div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
				<div className="flex items-center gap-1.5 text-sm min-w-0">
					<span className="text-primary-foreground/80 truncate">
						{m.landing_announcement_text()}
					</span>
					<Link
						to="/signup"
						className="font-semibold underline-offset-2 hover:underline whitespace-nowrap"
					>
						{m.landing_announcement_cta()}
					</Link>
				</div>
				<div className="hidden sm:flex items-center gap-5">
					<LangSwitcher className="text-primary-foreground/80 hover:text-primary-foreground" />
					<span className="text-primary-foreground/30">|</span>
					<Link
						to="/login"
						className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
					>
						{m.landing_button_login()}
					</Link>
				</div>
			</div>
		</div>
	);
}

export function LandingHeader() {
	return (
		<div className="sticky top-0 z-50 bg-background/95 backdrop-blur">
			<AnnouncementBar />
			<header>
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-8">
					<Link to="/" className="shrink-0">
						<BrandWordmark />
					</Link>

					<div className="hidden shrink-0 items-center gap-4 lg:flex">
						<Link
							to="/signup"
							className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							{m.landing_button_get_started_free()}
						</Link>
					</div>

					<div className="flex items-center gap-3 lg:hidden">
						<MobileMenu />
					</div>
				</div>
			</header>
		</div>
	);
}
