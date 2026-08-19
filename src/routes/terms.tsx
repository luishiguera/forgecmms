import { createFileRoute } from "@tanstack/react-router";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";
import { GITHUB_ISSUES_URL } from "@/lib/constants";
import * as m from "@/paraglide/messages";
import { seo } from "@/utils/seo";

const LAST_UPDATED = "February 21, 2026";

export const Route = createFileRoute("/terms")({
	head: () =>
		seo({
			title: "Terms of Service | forgecmms",
			description:
				"Terms governing use of forgecmms, including subscriptions, refunds, acceptable use, and limitations of liability.",
			path: "/terms",
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
						{m.terms_title()}
					</h1>
					<p className="mt-3 text-sm text-neutral-500">
						{m.terms_last_updated_label()}: {LAST_UPDATED}
					</p>
					<p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-700 md:text-base">
						{m.terms_intro()}
					</p>
				</header>

				<div className="space-y-8 py-8 text-sm leading-7 text-neutral-700 md:text-base">
					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art1_title()}
						</h2>
						<p className="mt-3">{m.terms_art1_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art2_title()}
						</h2>
						<p className="mt-3">{m.terms_art2_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art3_title()}
						</h2>
						<p className="mt-3">{m.terms_art3_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art4_title()}
						</h2>
						<p className="mt-3">{m.terms_art4_body1()}</p>
						<p className="mt-3">{m.terms_art4_body2()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art5_title()}
						</h2>
						<p className="mt-3">{m.terms_art5_body1()}</p>
						<p className="mt-3">{m.terms_art5_body2()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art6_title()}
						</h2>
						<p className="mt-3">{m.terms_art6_body()}</p>
						<ul className="mt-3 list-disc space-y-2 pl-6">
							<li>{m.terms_art6_li1()}</li>
							<li>{m.terms_art6_li2()}</li>
							<li>{m.terms_art6_li3()}</li>
							<li>{m.terms_art6_li4()}</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art7_title()}
						</h2>
						<p className="mt-3">{m.terms_art7_body1()}</p>
						<p className="mt-3">{m.terms_art7_body2()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art8_title()}
						</h2>
						<p className="mt-3">{m.terms_art8_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art9_title()}
						</h2>
						<p className="mt-3">{m.terms_art9_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art10_title()}
						</h2>
						<p className="mt-3">{m.terms_art10_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art11_title()}
						</h2>
						<p className="mt-3">{m.terms_art11_body1()}</p>
						<p className="mt-3">{m.terms_art11_body2()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art12_title()}
						</h2>
						<p className="mt-3">{m.terms_art12_body()}</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-neutral-900 md:text-xl">
							{m.terms_art13_title()}
						</h2>
						<p className="mt-3">
							{m.terms_art13_body()}{" "}
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
				</div>
			</main>
			<LandingFooter />
		</div>
	);
}
