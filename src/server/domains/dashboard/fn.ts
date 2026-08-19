import { createServerFn } from "@tanstack/react-start";
import { orgMiddleware } from "../../middleware";
import * as service from "./service";

export const getDashboardSummary = createServerFn({ method: "GET" })
	.middleware([orgMiddleware])
	.handler(({ context }) => service.summary(context.tenant));
