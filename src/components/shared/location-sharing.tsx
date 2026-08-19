import { NavigationArrowIcon } from "@phosphor-icons/react/dist/csr/NavigationArrow";
import { Switch } from "@/components/ui/switch";
import {
	startTracking,
	stopTracking,
	useLocationTracker,
} from "@/lib/tracking/use-tracker";
import * as m from "@/paraglide/messages";

export function LocationSharing({ orgId }: { orgId: string }) {
	const { isTracking, isDenied, last } = useLocationTracker();

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-3">
					<NavigationArrowIcon
						className="mt-0.5 size-5 text-muted-foreground"
						weight="duotone"
					/>
					<div>
						<p className="text-sm font-medium">{m.tracking_title()}</p>
						<p className="mt-0.5 text-sm text-muted-foreground">
							{m.tracking_description()}
						</p>
					</div>
				</div>
				<Switch
					checked={isTracking}
					onCheckedChange={(checked) =>
						checked ? startTracking(orgId) : stopTracking()
					}
				/>
			</div>

			{isDenied && (
				<p className="text-xs text-destructive">{m.tracking_denied()}</p>
			)}

			{isTracking && last && (
				<p className="text-xs text-muted-foreground">
					{m.tracking_last_fix({
						latitude: last.latitude.toFixed(5),
						longitude: last.longitude.toFixed(5),
					})}
				</p>
			)}
		</div>
	);
}
