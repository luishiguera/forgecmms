import { FileDashedIcon } from "@phosphor-icons/react/dist/csr/FileDashed";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";

interface ResourceNotFoundProps {
	title?: string;
	description?: string;
	className?: string;
	children?: React.ReactNode;
}

export function ResourceNotFound({
	title,
	description,
	className,
	children,
}: ResourceNotFoundProps) {
	return (
		<Empty className={cn("border", className)}>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<FileDashedIcon />
				</EmptyMedia>
				<EmptyTitle>{title ?? m.resource_not_found_title()}</EmptyTitle>
				<EmptyDescription>
					{description ?? m.resource_not_found_description()}
				</EmptyDescription>
			</EmptyHeader>
			{children ? <EmptyContent>{children}</EmptyContent> : null}
		</Empty>
	);
}
