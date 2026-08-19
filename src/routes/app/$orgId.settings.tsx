import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { SignOutIcon } from "@phosphor-icons/react/dist/csr/SignOut";
import { TranslateIcon } from "@phosphor-icons/react/dist/csr/Translate";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FieldAppBar } from "@/components/field/app-bar";
import { ConfirmSheet } from "@/components/field/confirm-sheet";
import { FieldSheet } from "@/components/field/field-sheet";
import {
	OptionSheetItem,
	SettingsRow,
	SettingsSection,
} from "@/components/field/settings-row";
import { LANGUAGES, type Language, languageLabel } from "@/lib/languages";
import { useLogoutMutation } from "@/lib/queries/auth";
import { organizationsQueryOptions } from "@/lib/queries/organization";
import { meQueryOptions, useUpdateProfileMutation } from "@/lib/queries/user";
import * as m from "@/paraglide/messages";
import { getLocale, setLocale } from "@/paraglide/runtime";

export const Route = createFileRoute("/app/$orgId/settings")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(organizationsQueryOptions()),
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId } = Route.useParams();
	const navigate = useNavigate();

	const goBack = () => navigate({ to: "/app/$orgId", params: { orgId } });

	const [sheet, setSheet] = useState<"organization" | "language" | null>(null);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const { data: me } = useQuery(meQueryOptions());
	const { data: organizations = [] } = useQuery(organizationsQueryOptions());
	const updateProfile = useUpdateProfileMutation();
	const logout = useLogoutMutation();

	const organization = organizations.find(
		(entry) => entry.id?.toString() === orgId,
	);
	const language = (me?.language ?? getLocale()) as Language;

	const pickLanguage = (next: Language) => {
		setSheet(null);
		updateProfile.mutate(
			{ language: next },
			{
				onSuccess: () => setLocale(next),
				onError: () => toast.error(m.field_save_error()),
			},
		);
	};

	return (
		<div className="flex flex-1 min-h-0 flex-col">
			<FieldAppBar title={m.field_settings_title()} onBack={goBack} />

			<div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto px-4 pb-10">
				<SettingsSection title={m.settings_nav_profile()} />
				<SettingsRow
					icon={UserIcon}
					title={m.settings_nav_profile()}
					subtitle={m.field_settings_profile_subtitle()}
					onClick={() =>
						navigate({ to: "/app/$orgId/settings/profile", params: { orgId } })
					}
				/>

				<SettingsSection title={m.settings_nav_organization()} />
				<SettingsRow
					icon={BuildingsIcon}
					title={m.field_current_organization()}
					subtitle={organization?.name}
					onClick={() => setSheet("organization")}
				/>

				<SettingsSection title={m.profile_field_language()} />
				<SettingsRow
					icon={TranslateIcon}
					title={languageLabel(language)}
					subtitle={m.field_language_hint()}
					onClick={() => setSheet("language")}
				/>

				<SettingsSection title={m.field_settings_section_actions()} />
				<SettingsRow
					icon={SignOutIcon}
					title={m.field_logout()}
					subtitle={m.field_logout_subtitle()}
					destructive
					onClick={() => setIsLoggingOut(true)}
				/>
			</div>

			<FieldSheet
				open={sheet === "organization"}
				title={m.field_select_organization()}
				onOpenChange={(open) => !open && setSheet(null)}
			>
				<div className="flex min-h-0 flex-col gap-2 overflow-y-auto p-6">
					{organizations.map((entry) => (
						<OptionSheetItem
							key={entry.id}
							label={entry.name}
							isSelected={entry.id?.toString() === orgId}
							onClick={() => {
								setSheet(null);
								navigate({
									to: "/app/$orgId/settings",
									params: { orgId: entry.id.toString() },
									replace: true,
								});
							}}
						/>
					))}
				</div>
			</FieldSheet>

			<FieldSheet
				open={sheet === "language"}
				title={m.field_select_language()}
				onOpenChange={(open) => !open && setSheet(null)}
			>
				<div className="flex min-h-0 flex-col gap-2 overflow-y-auto p-6">
					{LANGUAGES.map((option) => (
						<OptionSheetItem
							key={option.value}
							label={option.label}
							isSelected={option.value === language}
							onClick={() => pickLanguage(option.value)}
						/>
					))}
				</div>
			</FieldSheet>

			<ConfirmSheet
				open={isLoggingOut}
				title={m.field_logout()}
				message={m.field_logout_confirm()}
				confirmLabel={m.field_logout()}
				isSaving={logout.isPending}
				onOpenChange={setIsLoggingOut}
				onConfirm={() =>
					logout.mutate(undefined, {
						onSuccess: () => navigate({ to: "/login" }),
					})
				}
			/>
		</div>
	);
}
