import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarIcon } from "@phosphor-icons/react/dist/csr/Calendar";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/csr/CalendarDots";
import { CameraIcon } from "@phosphor-icons/react/dist/csr/Camera";
import { CheckSquareIcon } from "@phosphor-icons/react/dist/csr/CheckSquare";
import { EnvelopeIcon } from "@phosphor-icons/react/dist/csr/Envelope";
import { FileIcon } from "@phosphor-icons/react/dist/csr/File";
import { HashIcon } from "@phosphor-icons/react/dist/csr/Hash";
import { ImageIcon } from "@phosphor-icons/react/dist/csr/Image";
import { LinkIcon } from "@phosphor-icons/react/dist/csr/Link";
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks";
import { NoteIcon } from "@phosphor-icons/react/dist/csr/Note";
import { ParagraphIcon } from "@phosphor-icons/react/dist/csr/Paragraph";
import { PencilLineIcon } from "@phosphor-icons/react/dist/csr/PencilLine";
import { PhoneIcon } from "@phosphor-icons/react/dist/csr/Phone";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { RadioButtonIcon } from "@phosphor-icons/react/dist/csr/RadioButton";
import { SlidersIcon } from "@phosphor-icons/react/dist/csr/Sliders";
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/csr/SpeakerHigh";
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star";
import { TableIcon } from "@phosphor-icons/react/dist/csr/Table";
import { TextAaIcon } from "@phosphor-icons/react/dist/csr/TextAa";
import { ToggleLeftIcon } from "@phosphor-icons/react/dist/csr/ToggleLeft";
import { VideoCameraIcon } from "@phosphor-icons/react/dist/csr/VideoCamera";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";

import { useMountEffect } from "@/hooks/use-mount-effect";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages";
import { EmbedBlock, type EmbedBlockProps } from "./nodes/embed-block";
import { FieldBlock, type FieldBlockProps } from "./nodes/field-block";
import {
	ALL_BLOCK_ITEMS,
	type BlockItem,
	createDefaultEmbed,
	createDefaultField,
	type EditorBlock,
	type EmbedConfig,
	type EmbedType,
	type FieldType,
	type FormFieldConfig,
	type ProcedureBuilderData,
} from "./utils/types";

interface ProcedureEditorProps {
	initialData?: ProcedureBuilderData;
	selectedFieldId: string | null;
	onFieldSelect: (fieldId: string | null) => void;
	onFieldsChange: (fields: FormFieldConfig[]) => void;
	onEmbedsChange?: (embeds: EmbedConfig[]) => void;
	onBlocksChange?: (blocks: EditorBlock[]) => void;
}

export interface ProcedureEditorRef {
	updateField: (fieldId: string, updates: Partial<FormFieldConfig>) => void;
	updateEmbed: (embedId: string, updates: Partial<EmbedConfig>) => void;
}

const fieldTypeIcons: Record<
	FieldType,
	React.ComponentType<{
		className?: string;
		weight?: "duotone" | "regular" | "bold";
	}>
> = {
	short_text: TextAaIcon,
	long_text: ParagraphIcon,
	email: EnvelopeIcon,
	phone: PhoneIcon,
	link: LinkIcon,
	multiple_choice: RadioButtonIcon,
	checkboxes: CheckSquareIcon,
	multi_select: ListChecksIcon,
	number: HashIcon,
	linear_scale: SlidersIcon,
	rating: StarIcon,
	date: CalendarIcon,
	datetime: CalendarDotsIcon,
	matrix: TableIcon,
	signature: PencilLineIcon,
	photo: CameraIcon,
	file: FileIcon,
	toggle: ToggleLeftIcon,
};

const embedTypeIcons: Record<
	EmbedType,
	React.ComponentType<{
		className?: string;
		weight?: "duotone" | "regular" | "bold";
	}>
> = {
	image: ImageIcon,
	video: VideoCameraIcon,
	audio: SpeakerHighIcon,
	note: NoteIcon,
};

const blockItemIcons: Record<
	string,
	React.ComponentType<{
		className?: string;
		weight?: "duotone" | "regular" | "bold";
	}>
> = {
	...fieldTypeIcons,
	...embedTypeIcons,
};

function SortableFieldBlock(props: FieldBlockProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: props.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes}>
			<FieldBlock {...props} dragHandleProps={listeners} />
		</div>
	);
}

function SortableEmbedBlock(props: EmbedBlockProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: props.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1 : 0,
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes}>
			<EmbedBlock {...props} dragHandleProps={listeners} />
		</div>
	);
}

function initializeBlocks(initialData?: ProcedureBuilderData): EditorBlock[] {
	if (!initialData?.fields.length && !initialData?.embeds?.length) return [];

	const fieldBlocks: (EditorBlock & { _order: number })[] = (
		initialData.fields ?? []
	).map((field, i) => ({
		nodeType: "field" as const,
		id: field.id,
		data: { ...field, order: field.order ?? i },
		_order: field.order ?? i,
	}));

	const embedBlocks: (EditorBlock & { _order: number })[] = (
		initialData.embeds ?? []
	).map((embed, i) => ({
		nodeType: "embed" as const,
		id: embed.id,
		data: embed,
		_order: embed.order ?? fieldBlocks.length + i,
	}));

	return [...fieldBlocks, ...embedBlocks]
		.sort((a, b) => a._order - b._order)
		.map(({ _order, ...block }) => block);
}

export const ProcedureEditor = forwardRef<
	ProcedureEditorRef,
	ProcedureEditorProps
>(function ProcedureEditor(
	{
		initialData,
		selectedFieldId,
		onFieldSelect,
		onFieldsChange,
		onEmbedsChange,
		onBlocksChange,
	},
	ref,
) {
	const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
		initializeBlocks(initialData),
	);
	const [showAddMenu, setShowAddMenu] = useState(false);
	const addButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const fields = blocks
			.filter((b) => b.nodeType === "field")
			.map((b) => b.data);
		onFieldsChange(fields);

		if (onEmbedsChange) {
			const embeds = blocks
				.filter((b) => b.nodeType === "embed")
				.map((b) => b.data);
			onEmbedsChange(embeds);
		}

		onBlocksChange?.(blocks);
	}, [blocks, onBlocksChange, onEmbedsChange, onFieldsChange]);

	const handleLabelChange = useCallback((fieldId: string, newLabel: string) => {
		setBlocks((prev) =>
			prev.map((b) =>
				b.id === fieldId && b.nodeType === "field"
					? { ...b, data: { ...b.data, label: newLabel } }
					: b,
			),
		);
	}, []);

	const handleEmbedUpdate = useCallback(
		(
			embedId: string,
			updates: { src?: string; alt?: string; caption?: string },
		) => {
			setBlocks((prev) =>
				prev.map((b) =>
					b.id === embedId && b.nodeType === "embed"
						? { ...b, data: { ...b.data, ...updates } }
						: b,
				),
			);
		},
		[],
	);

	const handleDeleteEmbed = useCallback(
		(embedId: string) => {
			setBlocks((prev) => prev.filter((b) => b.id !== embedId));
			if (selectedFieldId === embedId) {
				onFieldSelect(null);
			}
		},
		[selectedFieldId, onFieldSelect],
	);

	const handleDeleteField = useCallback(
		(fieldId: string) => {
			setBlocks((prev) => prev.filter((b) => b.id !== fieldId));
			if (selectedFieldId === fieldId) {
				onFieldSelect(null);
			}
		},
		[selectedFieldId, onFieldSelect],
	);

	const handleInsertBelow = useCallback(
		(afterBlockId: string, fieldType: FieldType) => {
			setBlocks((prev) => {
				const existingFields = prev
					.filter((b) => b.nodeType === "field")
					.map((b) => b.data);
				const newField = createDefaultField(fieldType, existingFields);
				const insertIndex = prev.findIndex((b) => b.id === afterBlockId);
				if (insertIndex === -1) return prev;

				const newBlock: EditorBlock = {
					nodeType: "field",
					id: newField.id,
					data: newField,
				};

				const updated = [
					...prev.slice(0, insertIndex + 1),
					newBlock,
					...prev.slice(insertIndex + 1),
				];

				let fieldOrder = 0;
				return updated.map((b) => {
					if (b.nodeType === "field") {
						return {
							...b,
							data: { ...b.data, order: fieldOrder++ },
						};
					}
					return b;
				});
			});
		},
		[],
	);

	const handleAddMenuSelect = useCallback((item: BlockItem) => {
		setShowAddMenu(false);

		if (item.category === "embed") {
			const embed = createDefaultEmbed(item.type as EmbedType);
			setBlocks((prev) => [
				...prev,
				{ nodeType: "embed", id: embed.id, data: embed },
			]);
		} else {
			setBlocks((prev) => {
				const existingFields = prev
					.filter((b) => b.nodeType === "field")
					.map((b) => b.data);
				const field = createDefaultField(
					item.type as FieldType,
					existingFields,
				);
				return [...prev, { nodeType: "field", id: field.id, data: field }];
			});
		}
	}, []);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		setBlocks((prev) => {
			const oldIndex = prev.findIndex((b) => b.id === active.id);
			const newIndex = prev.findIndex((b) => b.id === over.id);
			if (oldIndex === -1 || newIndex === -1) return prev;

			const reordered = arrayMove(prev, oldIndex, newIndex);

			let fieldOrder = 0;
			return reordered.map((b) => {
				if (b.nodeType === "field") {
					const field = b.data as FormFieldConfig;
					return {
						...b,
						data: { ...field, order: fieldOrder++ },
					};
				}
				return b;
			});
		});
	}, []);

	useImperativeHandle(
		ref,
		() => ({
			updateField: (fieldId: string, updates: Partial<FormFieldConfig>) => {
				setBlocks((prev) =>
					prev.map((b) =>
						b.id === fieldId && b.nodeType === "field"
							? { ...b, data: { ...b.data, ...updates } }
							: b,
					),
				);
			},
			updateEmbed: (embedId: string, updates: Partial<EmbedConfig>) => {
				setBlocks((prev) =>
					prev.map((b) =>
						b.id === embedId && b.nodeType === "embed"
							? { ...b, data: { ...b.data, ...updates } }
							: b,
					),
				);
			},
		}),
		[],
	);

	return (
		<div className="relative">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToVerticalAxis]}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={blocks.map((b) => b.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-3">
						{blocks.map((block) => {
							const blockElement = (() => {
								if (block.nodeType === "field") {
									const field = block.data;
									return (
										<SortableFieldBlock
											key={field.id}
											id={field.id}
											fieldType={field.type}
											label={field.label}
											placeholder={field.placeholder}
											helpText={field.help_text}
											options={field.options}
											validation={field.validation}
											ratingConfig={field.rating_config}
											isSelected={selectedFieldId === field.id}
											onSelect={() => onFieldSelect(field.id)}
											onLabelChange={(label) =>
												handleLabelChange(field.id, label)
											}
											onDelete={() => handleDeleteField(field.id)}
											onInsertBelow={(type) =>
												handleInsertBelow(field.id, type)
											}
										/>
									);
								}
								const embed = block.data;
								return (
									<SortableEmbedBlock
										key={embed.id}
										id={embed.id}
										label={embed.label}
										embedType={embed.type}
										src={embed.src}
										alt={embed.alt}
										caption={embed.caption}
										noteVariant={embed.noteVariant}
										noteContent={embed.noteContent}
										isSelected={selectedFieldId === embed.id}
										onSelect={() => onFieldSelect(embed.id)}
										onUpdate={(updates) => handleEmbedUpdate(embed.id, updates)}
										onDelete={() => handleDeleteEmbed(embed.id)}
									/>
								);
							})();

							return <div key={block.id}>{blockElement}</div>;
						})}
					</div>
				</SortableContext>
			</DndContext>

			<div className="mt-4 relative">
				<button
					ref={addButtonRef}
					type="button"
					onClick={() => setShowAddMenu(!showAddMenu)}
					className={cn(
						"w-full py-3 px-4 flex items-center justify-center gap-2",
						"border border-dashed border-muted-foreground/30 rounded-lg",
						"text-muted-foreground text-sm",
						"hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors cursor-pointer",
					)}
				>
					<PlusIcon className="size-4" weight="bold" />
					<span>{m.proc_editor_add_field()}</span>
				</button>
				{showAddMenu && (
					<AddBlockMenuDropdown
						buttonRef={addButtonRef}
						onSelect={handleAddMenuSelect}
						onClose={() => setShowAddMenu(false)}
					/>
				)}
			</div>
		</div>
	);
});

interface AddBlockMenuProps {
	onSelect: (item: BlockItem) => void;
	onClose: () => void;
}

function AddBlockMenu({ onSelect }: AddBlockMenuProps) {
	const fieldItems = ALL_BLOCK_ITEMS.filter(
		(item) => item.category === "field",
	);
	const renderItem = (item: BlockItem) => {
		const Icon = blockItemIcons[item.type];
		return (
			<button
				key={item.type}
				type="button"
				onClick={() => onSelect(item)}
				className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md text-left transition-colors cursor-pointer hover:bg-muted"
			>
				{Icon && <Icon className="size-4 shrink-0" weight="duotone" />}
				<div className="flex-1 min-w-0">
					<div className="font-medium">{item.label}</div>
					<div className="text-xs text-muted-foreground truncate">
						{item.description}
					</div>
				</div>
			</button>
		);
	};

	return (
		<div className="p-1 max-h-80 overflow-y-auto" data-add-menu>
			{fieldItems.length > 0 && (
				<>
					<div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
						{m.proc_editor_fields_section()}
					</div>
					{fieldItems.map((item) => renderItem(item))}
				</>
			)}
		</div>
	);
}

interface AddBlockMenuDropdownProps {
	buttonRef: React.RefObject<HTMLButtonElement | null>;
	onSelect: (item: BlockItem) => void;
	onClose: () => void;
}

function AddBlockMenuDropdown({
	buttonRef,
	onSelect,
	onClose,
}: AddBlockMenuDropdownProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const [isReady, setIsReady] = useState(false);

	const position = useMemo(() => {
		if (!buttonRef.current) return "below";

		const buttonRect = buttonRef.current.getBoundingClientRect();
		const estimatedMenuHeight = 320;
		const spaceBelow = window.innerHeight - buttonRect.bottom;

		if (spaceBelow < estimatedMenuHeight + 16) {
			return "above";
		}
		return "below";
	}, [buttonRef]);

	useMountEffect(() => {
		requestAnimationFrame(() => {
			setIsReady(true);
		});
	});

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest("[data-add-menu]") && !target.closest("button")) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [onClose]);

	return (
		<div
			ref={menuRef}
			data-add-menu
			className={cn(
				"absolute left-0 right-0 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50 transition-opacity duration-100",
				position === "above" ? "bottom-full mb-2" : "top-full mt-2",
				isReady ? "opacity-100" : "opacity-0",
			)}
		>
			<AddBlockMenu onSelect={onSelect} onClose={onClose} />
		</div>
	);
}

export default ProcedureEditor;
