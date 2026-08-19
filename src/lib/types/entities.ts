export type CoreEntityType = "location" | "asset" | "part" | "work_order";
export type TaskStatus = "todo" | "in_progress" | "closed";

export type TaskOriginType = CoreEntityType;

export type SupportedTaskOriginType = "location";

export function isSupportedTaskOriginType(
	entityType: TaskOriginType,
): entityType is SupportedTaskOriginType {
	return entityType === "location";
}
