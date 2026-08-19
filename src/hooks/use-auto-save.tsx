import { useEffect, useRef, useState } from "react";

export type FieldStatus = "idle" | "saving" | "success" | "error";

export function getMutationStatus(mutation: {
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
}): FieldStatus {
	if (mutation.isPending) return "saving";
	if (mutation.isSuccess) return "success";
	if (mutation.isError) return "error";
	return "idle";
}

interface UseAutoSaveOptions {
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	error?: Error | null;
}

interface UseAutoSaveReturn {
	modifiedFields: Set<string>;
	getFieldStatus: (fieldName: string) => FieldStatus;
	getFieldError: (fieldName: string) => string | undefined;
	handleFieldChange: (fieldName: string) => void;
}

export function useAutoSave({
	isPending,
	isSuccess,
	isError,
	error,
}: UseAutoSaveOptions): UseAutoSaveReturn {
	const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
	const [savedFields, setSavedFields] = useState<Set<string>>(new Set());
	const [errorFields, setErrorFields] = useState<Map<string, string>>(
		new Map(),
	);

	const getFieldStatus = (fieldName: string): FieldStatus => {
		if (isPending && modifiedFields.has(fieldName)) return "saving";
		if (savedFields.has(fieldName)) return "success";
		if (errorFields.has(fieldName)) return "error";
		return "idle";
	};

	const getFieldError = (fieldName: string): string | undefined => {
		return errorFields.get(fieldName);
	};

	const handleFieldChange = (fieldName: string) => {
		setModifiedFields((prev) => new Set(prev).add(fieldName));
		setSavedFields((prev) => {
			const next = new Set(prev);
			next.delete(fieldName);
			return next;
		});
		setErrorFields((prev) => {
			const next = new Map(prev);
			next.delete(fieldName);
			return next;
		});
	};

	const prevPendingRef = useRef(isPending);

	useEffect(() => {
		if (prevPendingRef.current && !isPending) {
			if (isSuccess && modifiedFields.size > 0) {
				setSavedFields(new Set(modifiedFields));
				setModifiedFields(new Set());
				setTimeout(() => setSavedFields(new Set()), 2000);
			} else if (isError && modifiedFields.size > 0) {
				const errorMessage = error?.message ?? "Error saving";
				const newErrors = new Map<string, string>();
				for (const field of modifiedFields) {
					newErrors.set(field, errorMessage);
				}
				setErrorFields(newErrors);
				setModifiedFields(new Set());
				setTimeout(() => setErrorFields(new Map()), 5000);
			}
		}
		prevPendingRef.current = isPending;
	}, [isPending, isSuccess, isError, modifiedFields, error]);

	return {
		modifiedFields,
		getFieldStatus,
		getFieldError,
		handleFieldChange,
	};
}
