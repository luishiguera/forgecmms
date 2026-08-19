import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export function PaginationControl({
	currentPage,
	totalPages,
	onPageChange,
	className = "mt-4",
}: PaginationControlProps) {
	if (totalPages <= 1) return null;
	return (
		<Pagination className={className}>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={() => onPageChange(currentPage - 1)}
						aria-disabled={currentPage <= 1}
						className={
							currentPage <= 1
								? "pointer-events-none opacity-50"
								: "cursor-pointer"
						}
					/>
				</PaginationItem>

				{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
					if (
						pageNum === 1 ||
						pageNum === totalPages ||
						(pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
					) {
						return (
							<PaginationItem key={pageNum}>
								<PaginationLink
									onClick={() => onPageChange(pageNum)}
									isActive={pageNum === currentPage}
									className="cursor-pointer"
								>
									{pageNum}
								</PaginationLink>
							</PaginationItem>
						);
					}
					if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
						return (
							<PaginationItem key={pageNum}>
								<PaginationEllipsis />
							</PaginationItem>
						);
					}
					return null;
				})}

				<PaginationItem>
					<PaginationNext
						onClick={() => onPageChange(currentPage + 1)}
						aria-disabled={currentPage >= totalPages}
						className={
							currentPage >= totalPages
								? "pointer-events-none opacity-50"
								: "cursor-pointer"
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
