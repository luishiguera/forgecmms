import type { EntityType } from "@/lib/queries/attachments";
import { AttachmentList, DOCUMENT_MIME_TYPES } from "./attachment-list";
import { ImageGallery } from "./image-gallery";

interface AttachmentSectionsProps {
	orgId: string;
	entityType: EntityType;
	entityId: number;
}

export function AttachmentSections({
	orgId,
	entityType,
	entityId,
}: AttachmentSectionsProps) {
	return (
		<div className="space-y-6">
			<ImageGallery orgId={orgId} entityType={entityType} entityId={entityId} />
			<AttachmentList
				orgId={orgId}
				entityType={entityType}
				entityId={entityId}
				filter="documents"
				allowedTypes={DOCUMENT_MIME_TYPES}
			/>
		</div>
	);
}
