import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";

export function FieldSheet({
	open,
	title,
	action,
	className,
	children,
	onOpenChange,
}: {
	open: boolean;
	title: string;
	action?: ReactNode;
	className?: string;
	children: ReactNode;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
			<DrawerContent
				data-surface="field"
				className={cn(
					"rounded-t-2xl rounded-b-none border-b-0 [--drawer-inset:0px]",
					className,
				)}
			>
				<DrawerHeader className="flex-row items-center gap-2 px-6">
					<DrawerTitle className="min-w-0 flex-1 truncate text-left text-lg font-semibold">
						{title}
					</DrawerTitle>
					{action}
					<DrawerClose
						aria-label={m.field_close()}
						render={
							<Button
								variant="ghost"
								size="icon-lg"
								className="shrink-0 text-muted-foreground"
							/>
						}
					>
						<XIcon />
					</DrawerClose>
				</DrawerHeader>
				{children}
			</DrawerContent>
		</Drawer>
	);
}
