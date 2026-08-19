import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	type WorkingDay,
	WorkingHoursFields,
} from "@/components/shared/working-hours-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	memberQueryOptions,
	useUpdateMemberMutation,
} from "@/lib/queries/organization";
import * as m from "@/paraglide/messages";

export function MyWorkingHours({
	orgId,
	userId,
}: {
	orgId: string;
	userId: number;
}) {
	const { data: member, isPending } = useQuery(
		memberQueryOptions(orgId, userId),
	);
	const updateMember = useUpdateMemberMutation(orgId);
	const [draft, setDraft] = useState<WorkingDay[] | null>(null);

	if (isPending) {
		return (
			<div className="flex justify-center py-6">
				<Spinner className="size-5" />
			</div>
		);
	}

	const hours = draft ?? member?.working_hours ?? [];

	return (
		<div className="flex flex-col gap-4">
			<p className="text-sm text-muted-foreground">{m.hours_description()}</p>

			<WorkingHoursFields value={hours} onChange={setDraft} />

			<div className="flex justify-end">
				<Button
					type="button"
					disabled={draft === null || updateMember.isPending}
					onClick={() =>
						updateMember.mutate(
							{ userId, data: { working_hours: hours } },
							{
								onSuccess: () => {
									setDraft(null);
									toast.success(m.hours_saved());
								},
								onError: () => toast.error(m.hours_error()),
							},
						)
					}
				>
					{updateMember.isPending ? (
						<Spinner className="size-4" />
					) : (
						<CheckIcon className="size-4" weight="bold" />
					)}
					{m.hours_save()}
				</Button>
			</div>
		</div>
	);
}
