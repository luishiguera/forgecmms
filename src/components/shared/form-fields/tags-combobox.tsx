import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import * as m from "@/paraglide/messages";

interface TagsComboboxProps {
	value: number[];
	onChange: (ids: number[]) => void;
	allTags: { id: number; name: string }[];
	onTagCreate?: (name: string) => Promise<number>;
	placeholder?: string;
}

export function TagsCombobox({
	value,
	onChange,
	allTags,
	onTagCreate,
	placeholder,
}: TagsComboboxProps) {
	const [tagSearch, setTagSearch] = useState("");

	return (
		<>
			<Combobox
				value={value
					.map((id) => allTags.find((t) => t.id === id)?.name ?? "")
					.filter(Boolean)}
				onValueChange={(next) => {
					const names = next as string[];
					const ids = names
						.map((tagName) => allTags.find((t) => t.name === tagName)?.id)
						.filter((id): id is number => id !== undefined);
					onChange(ids);
				}}
				multiple
				items={allTags.map((t) => t.name)}
			>
				<ComboboxInput
					placeholder={placeholder ?? m.shared_field_search_tags()}
					onInput={(e) => setTagSearch(e.currentTarget.value)}
				/>
				<ComboboxContent>
					<ComboboxList>
						{(item) => (
							<ComboboxItem key={item} value={item}>
								{item}
							</ComboboxItem>
						)}
					</ComboboxList>
					<ComboboxEmpty>
						{tagSearch.trim() && onTagCreate ? (
							<button
								type="button"
								className="w-full text-center text-xs text-primary hover:underline cursor-pointer"
								onMouseDown={async (e) => {
									e.preventDefault();
									const newId = await onTagCreate(tagSearch.trim());
									onChange([...value, newId]);
									setTagSearch("");
								}}
							>
								{m.shared_field_create_tag({ name: tagSearch.trim() })}
							</button>
						) : (
							<span>{m.shared_no_tags_found()}</span>
						)}
					</ComboboxEmpty>
				</ComboboxContent>
			</Combobox>
			{value.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mt-2">
					{value.map((id) => {
						const tag = allTags.find((t) => t.id === id);
						if (!tag) return null;
						return (
							<Badge
								key={id}
								className="cursor-pointer"
								onClick={() => {
									onChange(value.filter((tid) => tid !== id));
								}}
							>
								{tag.name} ×
							</Badge>
						);
					})}
				</div>
			)}
		</>
	);
}
