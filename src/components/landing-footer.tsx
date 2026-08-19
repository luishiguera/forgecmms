import { GithubLogoIcon } from "@phosphor-icons/react/dist/csr/GithubLogo";
import { Link } from "@tanstack/react-router";
import { BrandWordmark } from "@/components/brand";
import {
	GITHUB_ISSUES_URL,
	GITHUB_LICENSE_URL,
	GITHUB_URL,
} from "@/lib/constants";
import * as m from "@/paraglide/messages";

type FooterLink = { label: string; href: string; internal?: boolean };

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
	return (
		<div>
			<p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/50">
				{title}
			</p>
			<ul className="mt-4 space-y-2.5 text-sm">
				{links.map(({ label, href, internal }) => (
					<li key={label}>
						{internal ? (
							<Link
								to={href}
								className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
							>
								{label}
							</Link>
						) : (
							<a
								href={href}
								className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
							>
								{label}
							</a>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}

export function LandingFooter() {
	const companyLinks: FooterLink[] = [
		{ label: m.landing_footer_source_repo(), href: GITHUB_URL },
		{ label: m.landing_footer_source_license(), href: GITHUB_LICENSE_URL },
		{ label: m.landing_footer_source_issues(), href: GITHUB_ISSUES_URL },
		{ label: m.landing_footer_terms(), href: "/terms", internal: true },
		{ label: m.landing_footer_privacy(), href: "/privacy", internal: true },
	];
	return (
		<footer className="bg-primary text-primary-foreground">
			<div className="mx-auto max-w-7xl px-8 py-14">
				<div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr]">
					<div>
						<BrandWordmark className="text-3xl" />
						<p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
							{m.landing_footer_tagline_v2()}
						</p>
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-5 inline-flex items-center gap-2 font-mono text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
						>
							<GithubLogoIcon className="size-4" weight="fill" />
							forgecmms
						</a>
						<p className="mt-2 text-sm text-primary-foreground/50">
							{m.landing_footer_oss_note()}
						</p>
					</div>
					<FooterCol
						title={m.landing_footer_col_company()}
						links={companyLinks}
					/>
				</div>
				<p className="mt-8 text-xs text-primary-foreground/50">
					&copy; {new Date().getFullYear()}{" "}
					<span className="font-logo text-sm">forgecmms</span>.{" "}
					{m.landing_footer_rights_reserved()}
				</p>
			</div>
		</footer>
	);
}
