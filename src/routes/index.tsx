import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/csr/GithubLogo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandWordmark } from "@/components/brand";
import { GITHUB_URL } from "@/lib/constants";
import { PRICE_USD } from "@/lib/pricing";
import * as m from "@/paraglide/messages";
import {
	jsonLdScript,
	organizationSchema,
	softwareApplicationSchema,
} from "@/utils/jsonld";
import { seo } from "@/utils/seo";

const LANDING_OG_IMAGE = "/og.png";
const HERO_VIDEO = "/hero.webm";

export const Route = createFileRoute("/")({
	head: () => {
		const head = seo({
			title: m.landing_seo_title(),
			description: m.landing_seo_description(),
			image: LANDING_OG_IMAGE,
			path: "/",
		});
		return {
			meta: head.meta,
			links: head.links,
			scripts: [
				jsonLdScript([
					organizationSchema(),
					softwareApplicationSchema({
						description: m.landing_seo_description(),
						priceUSD: PRICE_USD,
					}),
				]),
			],
		};
	},
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="bg-background text-foreground">
			<DemoHero />
		</div>
	);
}

function DemoNav({ tone }: { tone: "light" | "dark" }) {
	const isLight = tone === "light";
	const textCls = isLight ? "text-white" : "text-foreground";
	const ctaCls = isLight
		? "bg-white text-foreground hover:bg-white/90"
		: "bg-primary text-primary-foreground hover:bg-primary/90";
	return (
		<nav className={`absolute inset-x-0 top-0 z-20 ${textCls}`}>
			<div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:h-20 sm:px-8 lg:gap-8">
				<Link to="/" className="shrink-0">
					<BrandWordmark className="text-xl sm:text-2xl" />
				</Link>

				<div className="ml-auto flex shrink-0 items-center gap-4">
					<Link
						to="/signup"
						className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors sm:px-5 sm:py-2.5 ${ctaCls}`}
					>
						{m.landing_button_get_started_free()}
					</Link>
				</div>
			</div>
		</nav>
	);
}

function DemoHero() {
	return (
		<section className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-foreground text-white">
			<video
				src={HERO_VIDEO}
				autoPlay
				muted
				loop
				playsInline
				preload="auto"
				tabIndex={-1}
				className="absolute inset-0 size-full object-cover"
			/>
			<div className="absolute inset-0 bg-linear-to-br from-black/80 via-black/60 to-black/85" />
			<DemoNav tone="light" />
			<div className="relative flex flex-1 flex-col pt-16 sm:pt-20">
				<div className="flex flex-1 items-center py-12 sm:py-16 lg:py-0">
					<div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
						<div className="max-w-3xl">
							<h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
								{m.landing_hero_intro_title()}
							</h1>
							<p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-white/75 sm:mt-7 sm:text-lg md:text-xl">
								{m.landing_hero_intro_description()}
							</p>
							<div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
								<Link
									to="/signup"
									className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-base font-bold text-foreground transition-colors hover:bg-white/90 sm:px-8 sm:py-4"
								>
									{m.landing_button_get_started_free()}
									<ArrowRightIcon className="size-4" weight="bold" />
								</Link>
							</div>
						</div>
					</div>
				</div>

				<div className="relative border-t border-white/10 py-5">
					<div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 text-sm sm:px-8">
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 font-mono text-white transition-colors hover:text-white/70"
						>
							<GithubLogoIcon className="size-5" weight="fill" />
							forgecmms
						</a>
						<span className="text-white/60">{m.landing_hero_oss_note()}</span>
					</div>
				</div>
			</div>
		</section>
	);
}
