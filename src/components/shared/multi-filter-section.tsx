import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MultiFilterSectionProps {
	label: string;
	options: string[];
	values: string[];
	onChange: (values: string[]) => void;
}

export function MultiFilterSection({
	label,
	options,
	values,
	onChange,
}: MultiFilterSectionProps) {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredOptions = useMemo(() => {
		if (!searchTerm) return options;
		return options.filter((opt) =>
			opt.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [options, searchTerm]);

	const toggleOption = (option: string) => {
		if (values.includes(option)) {
			onChange(values.filter((v) => v !== option));
		} else {
			onChange([...values, option]);
		}
	};

	return (
		<div className="p-2">
			<div className="flex items-center justify-between px-2 mb-1.5">
				<Label className="text-xs text-muted-foreground">{label}</Label>
				{values.length > 0 && (
					<button
						type="button"
						onClick={() => onChange([])}
						className="text-[10px] text-muted-foreground hover:text-foreground"
					>
						Clear
					</button>
				)}
			</div>
			<div className="px-2 pb-1.5">
				<Input
					type="search"
					placeholder={`Search ${label.toLowerCase()}...`}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="h-7 text-xs"
				/>
			</div>
			<div className="max-h-40 overflow-y-auto">
				{filteredOptions.map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => toggleOption(option)}
						className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent text-left w-full"
					>
						<div
							className={`size-3.5 rounded border flex items-center justify-center transition-colors ${
								values.includes(option)
									? "bg-primary border-primary text-primary-foreground"
									: "border-muted-foreground/30"
							}`}
						>
							{values.includes(option) && (
								<CheckIcon className="size-2.5" weight="bold" />
							)}
						</div>
						{option}
					</button>
				))}
				{filteredOptions.length === 0 && (
					<p className="px-2 py-1.5 text-xs text-muted-foreground">
						No results found
					</p>
				)}
			</div>
		</div>
	);
}
