import type { Icon } from "@phosphor-icons/react";
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { useState } from "react";
import { FieldSheet } from "@/components/field/field-sheet";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";

export type SearchOption = {
	id: number;
	title: string;
	subtitle?: string;
	imageUrl?: string | null;
};

export function SearchSheet({
	open,
	title,
	icon: OptionIcon,
	placeholder,
	emptyLabel,
	query,
	options,
	isLoading,
	isSaving,
	multiple = true,
	onQueryChange,
	onOpenChange,
	onConfirm,
}: {
	open: boolean;
	title: string;
	icon: Icon;
	placeholder: string;
	emptyLabel: string;
	query: string;
	options: SearchOption[];
	isLoading: boolean;
	isSaving?: boolean;
	multiple?: boolean;
	onQueryChange: (value: string) => void;
	onOpenChange: (open: boolean) => void;
	onConfirm: (ids: number[]) => void;
}) {
	const [selected, setSelected] = useState<number[]>([]);

	const toggle = (id: number) => {
		if (!multiple) {
			onConfirm([id]);
			return;
		}
		setSelected((previous) =>
			previous.includes(id)
				? previous.filter((entry) => entry !== id)
				: [...previous, id],
		);
	};

	return (
		<FieldSheet
			open={open}
			title={title}
			className="h-[85dvh] max-h-[85dvh]"
			onOpenChange={onOpenChange}
		>
			<div className="px-4 pt-2 pb-3">
				<InputGroup>
					<InputGroupAddon>
						<MagnifyingGlassIcon className="size-5 text-muted-foreground" />
					</InputGroupAddon>
					<InputGroupInput
						value={query}
						placeholder={placeholder}
						onChange={(event) => onQueryChange(event.target.value)}
					/>
				</InputGroup>
			</div>

			<div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto px-4 pt-1 pb-4">
				{isLoading ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-6 text-primary" />
					</div>
				) : options.length === 0 ? (
					<p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
						{query.trim() ? m.wo_search_no_results() : emptyLabel}
					</p>
				) : (
					options.map((option) => {
						const isSelected = selected.includes(option.id);
						return (
							<button
								key={option.id}
								type="button"
								onClick={() => toggle(option.id)}
								className={cn(
									"flex items-center gap-3 rounded-lg p-3 text-left ring-1",
									isSelected
										? "bg-primary/10 ring-primary"
										: "ring-border hover:bg-muted/40",
								)}
							>
								{option.imageUrl ? (
									<img
										src={option.imageUrl}
										alt={option.title}
										className="size-10 shrink-0 rounded-md object-cover"
									/>
								) : (
									<OptionIcon className="size-5 shrink-0 text-muted-foreground" />
								)}
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-medium">
										{option.title}
									</span>
									{option.subtitle && (
										<span className="block truncate text-xs text-muted-foreground">
											{option.subtitle}
										</span>
									)}
								</span>
								{isSelected && (
									<CheckIcon
										className="size-5 shrink-0 text-primary"
										weight="bold"
									/>
								)}
							</button>
						);
					})
				)}
			</div>

			{multiple && selected.length > 0 && (
				<div className="border-t p-4">
					<Button
						type="button"
						size="xl"
						className="w-full"
						disabled={isSaving}
						onClick={() => onConfirm(selected)}
					>
						{isSaving ? (
							<Spinner />
						) : (
							m.wo_add_selected({ count: selected.length })
						)}
					</Button>
				</div>
			)}
		</FieldSheet>
	);
}
