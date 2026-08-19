DROP INDEX "idx_procedures_deleted_at";--> statement-breakpoint
CREATE INDEX "idx_procedures_deleted_at" ON "procedures" USING btree ("organization_id") WHERE deleted_at IS NULL;