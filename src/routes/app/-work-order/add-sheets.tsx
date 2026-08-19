import { CubeIcon } from "@phosphor-icons/react/dist/csr/Cube";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { UserIcon } from "@phosphor-icons/react/dist/csr/User";
import { WrenchIcon } from "@phosphor-icons/react/dist/csr/Wrench";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { assetsQueryOptions } from "@/lib/queries/assets";
import { locationsQueryOptions } from "@/lib/queries/locations";
import { membersQueryOptions } from "@/lib/queries/members";
import { partsQueryOptions } from "@/lib/queries/parts";
import { proceduresQueryOptions } from "@/lib/queries/procedures";
import * as m from "@/paraglide/messages";
import { SearchSheet } from "./search-sheet";

type SheetProps = {
	orgId: string;
	open: boolean;
	existingIds: number[];
	isSaving: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (ids: number[]) => void;
};

const SEARCH_PARAMS = { page: 1, size: 50 };

export function AddAssetsSheet({
	orgId,
	open,
	existingIds,
	isSaving,
	onOpenChange,
	onConfirm,
}: SheetProps) {
	const [query, setQuery] = useState("");
	const search = useDebounce(query, 300);
	const { data, isFetching } = useQuery({
		...assetsQueryOptions(orgId, { ...SEARCH_PARAMS, q: search || undefined }),
		enabled: open,
	});

	return (
		<SearchSheet
			open={open}
			title={m.wo_add_assets()}
			icon={CubeIcon}
			placeholder={m.wo_search_assets()}
			emptyLabel={m.wo_search_empty_assets()}
			query={query}
			isLoading={isFetching}
			isSaving={isSaving}
			options={(data?.items ?? [])
				.filter((asset) => !existingIds.includes(asset.id))
				.map((asset) => ({
					id: asset.id,
					title: asset.name,
					subtitle: asset.serial_number,
					imageUrl: asset.image_url,
				}))}
			onQueryChange={setQuery}
			onOpenChange={onOpenChange}
			onConfirm={onConfirm}
		/>
	);
}

export function AddPartsSheet({
	orgId,
	open,
	existingIds,
	isSaving,
	onOpenChange,
	onConfirm,
}: SheetProps) {
	const [query, setQuery] = useState("");
	const search = useDebounce(query, 300);
	const { data, isFetching } = useQuery({
		...partsQueryOptions(orgId, { ...SEARCH_PARAMS, q: search || undefined }),
		enabled: open,
	});

	return (
		<SearchSheet
			open={open}
			title={m.wo_add_parts()}
			icon={WrenchIcon}
			placeholder={m.wo_search_parts()}
			emptyLabel={m.wo_search_empty_parts()}
			query={query}
			isLoading={isFetching}
			isSaving={isSaving}
			options={(data?.items ?? [])
				.filter((part) => !existingIds.includes(part.id))
				.map((part) => ({
					id: part.id,
					title: part.name,
					subtitle: part.sku,
					imageUrl: part.image_url,
				}))}
			onQueryChange={setQuery}
			onOpenChange={onOpenChange}
			onConfirm={onConfirm}
		/>
	);
}

export function AddProceduresSheet({
	orgId,
	open,
	existingIds,
	isSaving,
	onOpenChange,
	onConfirm,
}: SheetProps) {
	const [query, setQuery] = useState("");
	const search = useDebounce(query, 300);
	const { data, isFetching } = useQuery({
		...proceduresQueryOptions(orgId, {
			...SEARCH_PARAMS,
			q: search || undefined,
		}),
		enabled: open,
	});

	return (
		<SearchSheet
			open={open}
			title={m.wo_add_procedures()}
			icon={ListChecksIcon}
			placeholder={m.wo_search_procedures()}
			emptyLabel={m.wo_search_empty_procedures()}
			query={query}
			isLoading={isFetching}
			isSaving={isSaving}
			options={(data?.items ?? [])
				.filter((procedure) => !existingIds.includes(procedure.id))
				.map((procedure) => ({
					id: procedure.id,
					title: procedure.name,
					subtitle: procedure.description,
				}))}
			onQueryChange={setQuery}
			onOpenChange={onOpenChange}
			onConfirm={onConfirm}
		/>
	);
}

export function AddAssigneesSheet({
	orgId,
	open,
	existingIds,
	isSaving,
	onOpenChange,
	onConfirm,
}: SheetProps) {
	const [query, setQuery] = useState("");
	const search = useDebounce(query, 300);
	const { data, isFetching } = useQuery({
		...membersQueryOptions(orgId, { ...SEARCH_PARAMS, q: search || undefined }),
		enabled: open,
	});

	return (
		<SearchSheet
			open={open}
			title={m.wo_add_assignees()}
			icon={UserIcon}
			placeholder={m.wo_search_members()}
			emptyLabel={m.wo_search_empty_members()}
			query={query}
			isLoading={isFetching}
			isSaving={isSaving}
			options={(data?.items ?? [])
				.filter((member) => !existingIds.includes(member.user_id))
				.map((member) => ({
					id: member.user_id,
					title: member.full_name,
					subtitle: member.email,
					imageUrl: member.photo_url,
				}))}
			onQueryChange={setQuery}
			onOpenChange={onOpenChange}
			onConfirm={onConfirm}
		/>
	);
}

export function AddLocationSheet({
	orgId,
	open,
	isSaving,
	onOpenChange,
	onConfirm,
}: Omit<SheetProps, "existingIds">) {
	const [query, setQuery] = useState("");
	const search = useDebounce(query, 300);
	const { data, isFetching } = useQuery({
		...locationsQueryOptions(orgId, {
			...SEARCH_PARAMS,
			q: search || undefined,
		}),
		enabled: open,
	});

	return (
		<SearchSheet
			open={open}
			multiple={false}
			title={m.wo_add_location()}
			icon={MapPinIcon}
			placeholder={m.wo_search_locations()}
			emptyLabel={m.wo_search_empty_locations()}
			query={query}
			isLoading={isFetching}
			isSaving={isSaving}
			options={(data?.items ?? []).map((location) => ({
				id: location.id,
				title: location.name,
				subtitle: location.address,
				imageUrl: location.image_url,
			}))}
			onQueryChange={setQuery}
			onOpenChange={onOpenChange}
			onConfirm={onConfirm}
		/>
	);
}
