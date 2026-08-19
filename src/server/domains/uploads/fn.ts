import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/utils/format-file-size";
import { AppError } from "../../errors";
import { authMiddleware, orgMiddleware } from "../../middleware";
import * as storage from "../../storage";
import { resolveTenant } from "../../tenant";

const extensionOf = (filename: string) => {
	const dot = filename.lastIndexOf(".");
	return dot > 0 ? filename.slice(dot) : "";
};

export const uploadFile = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: FormData) => data)
	.handler(async ({ data, context }) => {
		const tenant = await resolveTenant(
			context.userId,
			Number(data.get("organization_id")),
		);

		const file = data.get("file");
		if (!(file instanceof File)) {
			throw new AppError("invalid_input", "file is required");
		}
		if (file.size > MAX_UPLOAD_BYTES) {
			throw new AppError(
				"invalid_input",
				`file exceeds the ${MAX_UPLOAD_MB} MB limit`,
			);
		}

		const folder = (data.get("folder") as string | null) || "files";
		const path = `organizations/${tenant.organizationId}/${folder.replace(/^\/+|\/+$/g, "")}/${randomUUID()}${extensionOf(file.name)}`;

		await storage.upload(
			path,
			file.type || "application/octet-stream",
			new Uint8Array(await file.arrayBuffer()),
		);

		return { url: storage.publicURL(path), path };
	});

export const deleteFile = createServerFn({ method: "POST" })
	.middleware([orgMiddleware])
	.validator(z.object({ path: z.string().min(1) }))
	.handler(async ({ data, context }) => {
		const prefix = `organizations/${context.tenant.organizationId}/`;
		if (!data.path.startsWith(prefix)) throw new AppError("forbidden");

		await storage.remove(data.path);
		return { ok: true };
	});
