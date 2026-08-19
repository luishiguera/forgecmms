import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useMountEffect } from "@/hooks/use-mount-effect";

export function ErrorBoundary({ error }: { error: Error }) {
	const router = useRouter();

	useMountEffect(() => {
		console.error(error);
	});

	return (
		<div className="flex min-h-screen items-center justify-center p-6 font-[450]">
			<div className="flex w-full max-w-xs flex-col gap-8">
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-2 text-center">
						<WarningCircleIcon size="54" className="mx-auto" />
						<p className="text-sm font-normal text-muted-foreground/70">
							Something went wrong
						</p>
						<p className="text-xs font-normal text-muted-foreground/60 mt-2">
							{error.message || "An unexpected error occurred."}
						</p>
					</div>

					<div className="flex flex-col gap-3">
						<Button
							type="button"
							onClick={() => router.invalidate()}
							className="inline-flex items-center justify-center gap-2 h-10 px-2.5 text-xs/relaxed font-medium rounded-md border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
						>
							Try again
						</Button>
						<Link
							to="/"
							className="inline-flex items-center justify-center gap-2 h-10 px-2.5 text-xs/relaxed font-medium rounded-md border border-transparent hover:bg-muted hover:text-foreground transition-colors"
						>
							Go home
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
