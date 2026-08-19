import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "../../middleware";
import { userUpdateSchema } from "./schema";
import * as service from "./service";

export const getCurrentUser = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(({ context }) => service.get(context.userId));

export const updateCurrentUser = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(userUpdateSchema)
	.handler(({ data, context }) => service.update(context.userId, data));
