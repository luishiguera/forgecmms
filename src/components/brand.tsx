export function BrandLogo({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 256 256"
			className={className}
			aria-hidden="true"
		>
			<title>forgecmms</title>
			<path
				fill="currentColor"
				d="M232,96a72,72,0,0,1-100.94,66L79,222.22c-.12.14-.26.29-.39.42a32,32,0,0,1-45.26-45.26c.14-.13.28-.27.43-.39L94,124.94a72.07,72.07,0,0,1,83.54-98.78,8,8,0,0,1,3.93,13.19L144,80l5.66,26.35L176,112l40.65-37.52a8,8,0,0,1,13.19,3.93A72.6,72.6,0,0,1,232,96Z"
			/>
		</svg>
	);
}

export function BrandWordmark({
	className = "text-3xl",
}: {
	className?: string;
}) {
	return (
		<span className={`font-logo leading-none ${className}`}>forgecmms</span>
	);
}

export function BrandLockup({
	logoClassName = "h-6 w-auto",
	textClassName = "text-2xl",
}: {
	logoClassName?: string;
	textClassName?: string;
}) {
	return (
		<span className="inline-flex items-center gap-2">
			<BrandLogo className={logoClassName} />
			<span className={`font-logo leading-none ${textClassName}`}>
				forgecmms
			</span>
		</span>
	);
}
