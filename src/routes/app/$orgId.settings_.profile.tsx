import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { EnvelopeIcon } from "@phosphor-icons/react/dist/csr/Envelope";
import { GlobeIcon } from "@phosphor-icons/react/dist/csr/Globe";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { UserCircleIcon } from "@phosphor-icons/react/dist/csr/UserCircle";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FieldAppBar } from "@/components/field/app-bar";
import { FieldSheet } from "@/components/field/field-sheet";
import {
	OptionSheetItem,
	SettingsRow,
	SettingsSection,
} from "@/components/field/settings-row";
import { InstallApp } from "@/components/shared/install-app";
import { LocationSharing } from "@/components/shared/location-sharing";
import { MyWorkingHours } from "@/components/shared/my-working-hours";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useGoBack } from "@/hooks/use-go-back";
import { useProfilePhoto } from "@/lib/queries/profile-photo";
import { meQueryOptions, useUpdateProfileMutation } from "@/lib/queries/user";
import { setUse24hFormat, useTimeFormat } from "@/lib/time-format";
import * as m from "@/paraglide/messages";
import type { UserUpdateInput } from "@/server/domains/users/schema";

const TIMEZONES = Intl.supportedValuesOf("timeZone");

export const Route = createFileRoute("/app/$orgId/settings_/profile")({
	component: RouteComponent,
});

function RouteComponent() {
	const { orgId } = Route.useParams();
	const navigate = useNavigate();

	const goBack = useGoBack(() =>
		navigate({ to: "/app/$orgId/settings", params: { orgId } }),
	);

	const [sheet, setSheet] = useState<"name" | "timezone" | "format" | null>(
		null,
	);
	const [sheetEpoch, setSheetEpoch] = useState(0);

	const { data: me, isPending } = useQuery(meQueryOptions());
	const updateProfile = useUpdateProfileMutation();
	const photo = useProfilePhoto(orgId);
	const use24h = useTimeFormat();
	const photoInput = useRef<HTMLInputElement>(null);

	const openSheet = (next: "name" | "timezone" | "format") => {
		setSheetEpoch((epoch) => epoch + 1);
		setSheet(next);
	};

	const saveProfile = (data: UserUpdateInput) =>
		updateProfile.mutate(data, {
			onSuccess: () => {
				setSheet(null);
				toast.success(m.field_saved());
			},
			onError: () => toast.error(m.field_save_error()),
		});

	const pickTimeFormat = (value: boolean) => {
		setUse24hFormat(value);
		setSheet(null);
		toast.success(m.field_saved());
	};

	const uploadPhoto = async (file: File) => {
		try {
			await photo.upload(file);
			toast.success(m.field_saved());
		} catch {
			toast.error(m.profile_error_upload());
		}
	};

	if (isPending || !me) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<Spinner className="size-8 text-primary" />
			</div>
		);
	}

	return (
		<div className="flex flex-1 min-h-0 flex-col">
			<FieldAppBar title={m.settings_nav_profile()} onBack={goBack} />

			<div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto px-4 pb-10">
				<div className="flex flex-col items-center gap-3 py-4">
					<Avatar className="size-20">
						{photo.isUploading ? (
							<AvatarFallback>
								<Spinner className="size-5" />
							</AvatarFallback>
						) : (
							<>
								<AvatarImage
									src={me.photo_url ?? undefined}
									alt={me.full_name}
								/>
								<AvatarFallback>
									<UserCircleIcon
										className="size-8 text-muted-foreground"
										weight="duotone"
									/>
								</AvatarFallback>
							</>
						)}
					</Avatar>
					<input
						ref={photoInput}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={async (event) => {
							const file = event.target.files?.[0];
							event.target.value = "";
							if (file) await uploadPhoto(file);
						}}
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={photo.isUploading}
						onClick={() => photoInput.current?.click()}
					>
						{m.field_change_photo()}
					</Button>
				</div>

				<SettingsSection title={m.settings_nav_profile()} />
				<SettingsRow
					icon={UserIcon}
					title={m.field_edit_name()}
					subtitle={me.full_name}
					onClick={() => openSheet("name")}
				/>
				<SettingsRow
					icon={EnvelopeIcon}
					title={m.profile_field_email()}
					subtitle={me.email}
				/>
				<SettingsRow
					icon={GlobeIcon}
					title={m.profile_field_timezone()}
					subtitle={me.timezone}
					onClick={() => openSheet("timezone")}
				/>
				<SettingsRow
					icon={ClockIcon}
					title={m.profile_field_time_format()}
					subtitle={
						use24h ? m.field_time_format_24h() : m.field_time_format_12h()
					}
					onClick={() => openSheet("format")}
				/>

				<SettingsSection title={m.hours_section()} />
				<div className="rounded-lg p-4 ring-1 ring-border">
					<MyWorkingHours orgId={orgId} userId={me.id} />
				</div>

				<SettingsSection title={m.tracking_section()} />
				<div className="rounded-lg p-4 ring-1 ring-border">
					<LocationSharing orgId={orgId} />
				</div>

				<InstallApp />
			</div>

			<NameSheet
				key={`name-${sheetEpoch}`}
				open={sheet === "name"}
				fullName={me.full_name}
				isSaving={updateProfile.isPending}
				onOpenChange={(open) => !open && setSheet(null)}
				onSave={(full_name) => saveProfile({ full_name })}
			/>

			<TimezoneSheet
				key={`timezone-${sheetEpoch}`}
				open={sheet === "timezone"}
				timezone={me.timezone}
				onOpenChange={(open) => !open && setSheet(null)}
				onPick={(timezone) => saveProfile({ timezone })}
			/>

			<FieldSheet
				open={sheet === "format"}
				title={m.profile_field_time_format()}
				onOpenChange={(open) => !open && setSheet(null)}
			>
				<div className="flex flex-col gap-2 p-6">
					<OptionSheetItem
						label={m.field_time_format_24h()}
						isSelected={use24h}
						onClick={() => pickTimeFormat(true)}
					/>
					<OptionSheetItem
						label={m.field_time_format_12h()}
						isSelected={!use24h}
						onClick={() => pickTimeFormat(false)}
					/>
				</div>
			</FieldSheet>
		</div>
	);
}

function NameSheet({
	open,
	fullName,
	isSaving,
	onOpenChange,
	onSave,
}: {
	open: boolean;
	fullName: string;
	isSaving: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (fullName: string) => void;
}) {
	const [value, setValue] = useState(fullName);

	return (
		<FieldSheet
			open={open}
			title={m.field_edit_name()}
			onOpenChange={onOpenChange}
		>
			<div className="flex flex-col gap-4 p-6">
				<Input
					value={value}
					placeholder={m.profile_placeholder_fullname()}
					onChange={(event) => setValue(event.target.value)}
				/>
				<Button
					type="button"
					size="xl"
					disabled={isSaving || !value.trim()}
					onClick={() => onSave(value.trim())}
				>
					{isSaving ? <Spinner /> : m.wo_button_save()}
				</Button>
			</div>
		</FieldSheet>
	);
}

function TimezoneSheet({
	open,
	timezone,
	onOpenChange,
	onPick,
}: {
	open: boolean;
	timezone: string;
	onOpenChange: (open: boolean) => void;
	onPick: (timezone: string) => void;
}) {
	const [query, setQuery] = useState("");
	const search = query.trim().toLowerCase();
	const options = TIMEZONES.filter((zone) =>
		zone.toLowerCase().includes(search),
	).slice(0, 100);

	return (
		<FieldSheet
			open={open}
			title={m.profile_field_timezone()}
			className="h-[85dvh] max-h-[85dvh]"
			onOpenChange={onOpenChange}
		>
			<div className="px-4 pt-2 pb-2">
				<Input
					value={query}
					placeholder={m.profile_placeholder_timezone()}
					onChange={(event) => setQuery(event.target.value)}
				/>
			</div>
			<div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto px-4 pb-4">
				{options.map((zone) => (
					<OptionSheetItem
						key={zone}
						label={zone}
						isSelected={zone === timezone}
						onClick={() => onPick(zone)}
					/>
				))}
			</div>
		</FieldSheet>
	);
}
