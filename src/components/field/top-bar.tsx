import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { NavigationArrowIcon } from "@phosphor-icons/react/dist/csr/NavigationArrow";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BrandWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { organizationsQueryOptions } from "@/lib/queries/organization";
import {
	startTracking,
	stopTracking,
	useLocationTracker,
} from "@/lib/tracking/use-tracker";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";

export function FieldTopBar({
	orgId,
	onRefresh,
}: {
	orgId: string;
	onRefresh: () => void;
}) {
	const { isTracking, isDenied } = useLocationTracker();
	const { data: organizations = [] } = useQuery(organizationsQueryOptions());

	const organization = organizations.find(
		(entry) => entry.id?.toString() === orgId,
	);

	return (
		<header className="flex h-14 shrink-0 items-center border-b border-border/70 px-4">
			<div className="min-w-0">
				<BrandWordmark className="text-xl" />
				{organization && (
					<p className="mt-0.5 truncate text-xs text-muted-foreground">
						{organization.name}
					</p>
				)}
			</div>

			<div className="-mr-0.5 ml-auto flex shrink-0 items-center gap-1">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label={m.field_refresh()}
					onClick={onRefresh}
				>
					<ArrowClockwiseIcon className="size-[22px] text-muted-foreground" />
				</Button>

				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label={m.tracking_title()}
					onClick={() => (isTracking ? stopTracking() : startTracking(orgId))}
				>
					<NavigationArrowIcon
						className={cn(
							"size-[22px]",
							isTracking
								? "text-green-600"
								: isDenied
									? "text-amber-600"
									: "text-muted-foreground",
						)}
						weight={isTracking ? "fill" : "regular"}
					/>
				</Button>

				<Button
					variant="ghost"
					size="icon"
					aria-label={m.settings_sidebar()}
					nativeButton={false}
					render={<Link to="/app/$orgId/settings" params={{ orgId }} />}
				>
					<GearSixIcon className="size-6 text-muted-foreground" />
				</Button>
			</div>
		</header>
	);
}
