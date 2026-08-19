import { createFileRoute } from "@tanstack/react-router";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";
import { GITHUB_ISSUES_URL } from "@/lib/constants";
import * as m from "@/paraglide/messages";
import { seo } from "@/utils/seo";

const LAST_UPDATED = "May 21, 2026";

export const Route = createFileRoute("/privacy")({
	head: () =>
		seo({
			title: "Privacy Policy | forgecmms",
			description:
				"How forgecmms collects, uses, shares, and protects account, operational, location, and billing-related personal data.",
			path: "/privacy",
		}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="min-h-screen bg-white">
			<LandingHeader />
			<main className="mx-auto max-w-7xl px-8 py-12 md:py-16">
				<header className="border-b border-neutral-200 pb-6 md:pb-8">
					<h1 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
						{m.privacy_title()}
					</h1>
					<p className="mt-3 text-sm text-neutral-500">
						{m.privacy_last_updated_label()}: {LAST_UPDATED}
					</p>
					<p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-700 md:text-base">
						{m.privacy_intro()}
					</p>
				</header>

				<div className="space-y-8 py-8 text-sm leading-7 text-neutral-700 md:text-base">
					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art1_title()}
						</h2>
						<p className="mt-3">{m.privacy_art1_body1()}</p>
						<p className="mt-3">{m.privacy_art1_body2()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art2_title()}
						</h2>
						<p className="mt-3">{m.privacy_art2_intro()}</p>
						<ul className="mt-3 list-disc space-y-2 pl-6">
							<li>
								<strong>{m.privacy_art2_li1_label()}</strong>{" "}
								{m.privacy_art2_li1_body()}
							</li>
							<li>
								<strong>{m.privacy_art2_li2_label()}</strong>{" "}
								{m.privacy_art2_li2_body()}
							</li>
							<li>
								<strong>{m.privacy_art2_li3_label()}</strong>{" "}
								{m.privacy_art2_li3_body()}
							</li>
							<li>
								<strong>{m.privacy_art2_li4_label()}</strong>{" "}
								{m.privacy_art2_li4_body()}
							</li>
							<li>
								<strong>{m.privacy_art2_li5_label()}</strong>{" "}
								{m.privacy_art2_li5_body()}
							</li>
							<li>
								<strong>{m.privacy_art2_li6_label()}</strong>{" "}
								{m.privacy_art2_li6_body()}
							</li>
							<li>
								<strong>{m.privacy_art2_li7_label()}</strong>{" "}
								{m.privacy_art2_li7_body()}
							</li>
							<li>
								<strong>{m.privacy_art2_li8_label()}</strong>{" "}
								{m.privacy_art2_li8_body()}
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art3_title()}
						</h2>
						<p className="mt-3">{m.privacy_art3_intro()}</p>
						<ul className="mt-3 list-disc space-y-2 pl-6">
							<li>{m.privacy_art3_li1()}</li>
							<li>{m.privacy_art3_li2()}</li>
							<li>{m.privacy_art3_li3()}</li>
							<li>{m.privacy_art3_li4()}</li>
							<li>{m.privacy_art3_li5()}</li>
							<li>{m.privacy_art3_li6()}</li>
							<li>{m.privacy_art3_li7()}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art4_title()}
						</h2>
						<p className="mt-3">{m.privacy_art4_intro()}</p>
						<ul className="mt-3 list-disc space-y-2 pl-6">
							<li>
								<strong>{m.privacy_art4_li1_label()}</strong>{" "}
								{m.privacy_art4_li1_body()}
							</li>
							<li>
								<strong>{m.privacy_art4_li2_label()}</strong>{" "}
								{m.privacy_art4_li2_body()}
							</li>
							<li>
								<strong>{m.privacy_art4_li3_label()}</strong>{" "}
								{m.privacy_art4_li3_body()}
							</li>
							<li>
								<strong>{m.privacy_art4_li4_label()}</strong>{" "}
								{m.privacy_art4_li4_body()}
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art5_title()}
						</h2>
						<p className="mt-3">{m.privacy_art5_intro()}</p>
						<ul className="mt-3 list-disc space-y-2 pl-6">
							<li>
								<strong>{m.privacy_art5_li1_label()}</strong>{" "}
								{m.privacy_art5_li1_body()}
							</li>
							<li>
								<strong>{m.privacy_art5_li2_label()}</strong>{" "}
								{m.privacy_art5_li2_body()}
							</li>
							<li>
								<strong>{m.privacy_art5_li3_label()}</strong>{" "}
								{m.privacy_art5_li3_body()}
							</li>
							<li>
								<strong>{m.privacy_art5_li4_label()}</strong>{" "}
								{m.privacy_art5_li4_body()}
							</li>
						</ul>
						<p className="mt-3">{m.privacy_art5_footer()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art6_title()}
						</h2>
						<p className="mt-3">{m.privacy_art6_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art7_title()}
						</h2>
						<p className="mt-3">{m.privacy_art7_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art8_title()}
						</h2>
						<p className="mt-3">{m.privacy_art8_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art9_title()}
						</h2>
						<p className="mt-3">{m.privacy_art9_body1()}</p>
						<p className="mt-3">{m.privacy_art9_body2()}</p>
						<p className="mt-3">{m.privacy_art9_body3()}</p>
						<p className="mt-3">{m.privacy_art9_body4()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art10_title()}
						</h2>
						<p className="mt-3">{m.privacy_art10_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art11_title()}
						</h2>
						<p className="mt-3">
							{m.privacy_art11_body()}{" "}
							<a
								href={GITHUB_ISSUES_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
							>
								forgecmms/issues
							</a>
							.
						</p>
					</section>

					<section id="data-deletion" className="scroll-mt-24">
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.privacy_art12_title()}
						</h2>
						<p className="mt-3">
							{m.privacy_art12_intro()}{" "}
							<a
								href={GITHUB_ISSUES_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
							>
								forgecmms/issues
							</a>
							.
						</p>
						<p className="mt-3">{m.privacy_art12_body()}</p>
					</section>
				</div>
			</main>
			<LandingFooter />
		</div>
	);
}
