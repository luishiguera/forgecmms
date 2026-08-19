import { startWorker } from "./src/server/jobs/worker";

startWorker().catch((error) => {
	console.error("worker failed to start", error);
	process.exit(1);
});
