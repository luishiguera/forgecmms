import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { type PointerEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import * as m from "@/paraglide/messages";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const STROKE_WIDTH = 2.5;

export function SignaturePad({
	value,
	onChange,
	disabled,
}: {
	value: string | undefined;
	onChange: (value: string | undefined) => void;
	disabled?: boolean;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawing = useRef(false);
	const [hasStrokes, setHasStrokes] = useState(false);

	const contextOf = (canvas: HTMLCanvasElement) => {
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		ctx.lineWidth = STROKE_WIDTH;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = "#111827";
		return ctx;
	};

	const pointOf = (event: PointerEvent<HTMLCanvasElement>) => {
		const canvas = event.currentTarget;
		const rect = canvas.getBoundingClientRect();
		return {
			x: ((event.clientX - rect.left) / rect.width) * canvas.width,
			y: ((event.clientY - rect.top) / rect.height) * canvas.height,
		};
	};

	const start = (event: PointerEvent<HTMLCanvasElement>) => {
		if (disabled) return;
		const ctx = contextOf(event.currentTarget);
		if (!ctx) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		drawing.current = true;
		const { x, y } = pointOf(event);
		ctx.beginPath();
		ctx.moveTo(x, y);
	};

	const move = (event: PointerEvent<HTMLCanvasElement>) => {
		if (!drawing.current) return;
		const ctx = contextOf(event.currentTarget);
		if (!ctx) return;
		const { x, y } = pointOf(event);
		ctx.lineTo(x, y);
		ctx.stroke();
		if (!hasStrokes) setHasStrokes(true);
	};

	const end = (event: PointerEvent<HTMLCanvasElement>) => {
		if (!drawing.current) return;
		drawing.current = false;
		event.currentTarget.releasePointerCapture(event.pointerId);
		onChange(event.currentTarget.toDataURL("image/png"));
	};

	const clear = () => {
		const canvas = canvasRef.current;
		if (canvas) {
			const ctx = canvas.getContext("2d");
			ctx?.clearRect(0, 0, canvas.width, canvas.height);
		}
		setHasStrokes(false);
		onChange(undefined);
	};

	if (value && !hasStrokes) {
		return (
			<div className="flex flex-col items-start gap-2">
				<img
					src={value}
					alt={m.proc_signature_label()}
					className="h-28 w-full max-w-sm rounded-lg bg-white object-contain ring-1 ring-border"
				/>
				{!disabled && (
					<Button type="button" variant="ghost" size="sm" onClick={clear}>
						<TrashIcon className="size-4" />
						{m.proc_signature_clear()}
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col items-start gap-2">
			<canvas
				ref={canvasRef}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
				data-base-ui-swipe-ignore=""
				onPointerDown={start}
				onPointerMove={move}
				onPointerUp={end}
				onPointerCancel={end}
				className="h-28 w-full max-w-sm touch-none rounded-lg bg-white ring-1 ring-border"
			/>
			<div className="flex items-center gap-2">
				<span className="text-xs text-muted-foreground">
					{m.proc_signature_hint()}
				</span>
				{hasStrokes && (
					<Button type="button" variant="ghost" size="sm" onClick={clear}>
						<TrashIcon className="size-4" />
						{m.proc_signature_clear()}
					</Button>
				)}
			</div>
		</div>
	);
}
