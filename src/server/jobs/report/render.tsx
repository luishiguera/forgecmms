import {
	Document,
	Image,
	Page,
	renderToBuffer,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import type { FormFieldConfig } from "../../domains/procedures/schema";
import type { JsonValue } from "../../json";
import {
	duration,
	formatScalar,
	formatWorkOrderDate,
	joinAny,
	joinComma,
	nonEmpty,
	type RenderCtx,
	toStrings,
} from "./format";
import {
	dataUrlOf,
	fetchEmbeddable,
	stripDataUrl,
	toEmbeddable,
} from "./images";
import type { OrgData, ProcedureBlock, WorkOrderData } from "./schema";

const DASH = "—";

const COLORS = {
	fg: "#0c0a09",
	primary: "#135b42",
	primaryFg: "#f3fbf7",
	primaryDark: "#134e39",
	mutedBg: "#f5f5f4",
	mutedFg: "#79716b",
	border: "#e7e5e4",
};

const styles = StyleSheet.create({
	page: {
		paddingTop: "12mm",
		paddingBottom: "16mm",
		paddingHorizontal: "14mm",
		fontSize: 9,
		color: COLORS.fg,
		fontFamily: "Helvetica",
	},
	header: { flexDirection: "row", marginBottom: "2mm" },
	logo: { width: "16mm", marginRight: "4mm", objectFit: "contain" },
	orgName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COLORS.fg },
	orgLine: { fontSize: 8, color: COLORS.mutedFg, marginTop: "1mm" },
	title: {
		fontSize: 16,
		fontFamily: "Helvetica-Bold",
		color: COLORS.primary,
		textAlign: "center",
		marginTop: "4mm",
	},
	subtitle: {
		fontSize: 11,
		color: COLORS.mutedFg,
		textAlign: "center",
		marginTop: "1.5mm",
	},
	section: {
		backgroundColor: COLORS.primary,
		borderWidth: 0.4,
		borderColor: COLORS.primaryDark,
		paddingVertical: "2.5mm",
		paddingHorizontal: "3mm",
		marginTop: "6mm",
	},
	sectionText: {
		fontSize: 10,
		fontFamily: "Helvetica-Bold",
		color: COLORS.primaryFg,
	},
	sub: {
		backgroundColor: COLORS.mutedBg,
		borderWidth: 0.3,
		borderColor: COLORS.border,
		paddingVertical: "2mm",
		paddingHorizontal: "3mm",
		marginTop: "3mm",
	},
	subText: {
		fontSize: 9.5,
		fontFamily: "Helvetica-Bold",
		color: COLORS.primary,
	},
	row: {
		flexDirection: "row",
		borderWidth: 0.2,
		borderColor: COLORS.border,
		borderTopWidth: 0,
		paddingVertical: "1.8mm",
		paddingHorizontal: "3mm",
	},
	label: { width: "33%", color: COLORS.mutedFg, paddingRight: "2mm" },
	value: { width: "67%", color: COLORS.fg },
	full: { width: "100%", color: COLORS.fg },
	bold: { fontFamily: "Helvetica-Bold" },
	imageRow: {
		borderWidth: 0.2,
		borderColor: COLORS.border,
		borderTopWidth: 0,
		padding: "2mm",
	},
	pageNumber: {
		position: "absolute",
		bottom: "8mm",
		left: 0,
		right: 0,
		textAlign: "center",
		fontSize: 8,
		color: COLORS.mutedFg,
	},
});

type Row =
	| { kind: "section"; text: string }
	| { kind: "sub"; text: string }
	| { kind: "kv"; label: string; value: string }
	| { kind: "bullet"; text: string }
	| { kind: "fieldLabel"; text: string }
	| { kind: "value"; text: string }
	| { kind: "image"; src: string; height: string };

type Builder = {
	rows: Row[];
	warnings: string[];
};

const section = (b: Builder, text: string) =>
	b.rows.push({ kind: "section", text });
const sub = (b: Builder, text: string) => b.rows.push({ kind: "sub", text });
const kv = (b: Builder, label: string, value: string) =>
	b.rows.push({ kind: "kv", label, value: value || DASH });

const renderField = async (
	b: Builder,
	field: FormFieldConfig,
	value: JsonValue | undefined,
	rc: RenderCtx,
) => {
	if (field.type === "signature") {
		b.rows.push({ kind: "fieldLabel", text: field.label });
		const raw = typeof value === "string" ? stripDataUrl(value) : "";
		if (!raw) {
			b.rows.push({ kind: "value", text: rc.t("signature_unavailable") });
			return;
		}
		try {
			const image = await toEmbeddable(Buffer.from(raw, "base64"));
			b.rows.push({ kind: "image", src: dataUrlOf(image), height: "30mm" });
		} catch (error) {
			b.warnings.push(`signature: ${String(error)}`);
			b.rows.push({ kind: "value", text: rc.t("signature_unavailable") });
		}
		return;
	}

	if (field.type === "photo") {
		b.rows.push({ kind: "fieldLabel", text: field.label });
		const urls = toStrings(value);
		if (urls.length === 0) {
			b.rows.push({ kind: "value", text: rc.t("no_response") });
			return;
		}
		for (const url of urls) {
			try {
				const image = await fetchEmbeddable(url);
				b.rows.push({ kind: "image", src: dataUrlOf(image), height: "36mm" });
			} catch (error) {
				b.warnings.push(`photo ${url}: ${String(error)}`);
				b.rows.push({ kind: "value", text: rc.t("image_unavailable") + url });
			}
		}
		return;
	}

	if (field.type === "matrix") {
		b.rows.push({ kind: "fieldLabel", text: field.label });
		const matrix =
			value && typeof value === "object" && !Array.isArray(value) ? value : {};
		if (Object.keys(matrix).length === 0) {
			b.rows.push({ kind: "value", text: rc.t("no_response") });
			return;
		}
		for (const rowName of field.matrix_config?.rows ?? []) {
			kv(b, `   ${rowName}`, joinAny(matrix[rowName]));
		}
		return;
	}

	kv(b, field.label, formatScalar(field, value, rc));
};

const buildRows = async (wo: WorkOrderData, rc: RenderCtx) => {
	const b: Builder = { rows: [], warnings: [] };
	const t = rc.t;

	section(b, t("section_details"));
	kv(b, t("label_id"), `#${wo.id}`);
	kv(b, t("label_status"), t(`status_${wo.status}`));
	kv(b, t("label_type"), t(`type_${wo.type}`));
	kv(b, t("label_priority"), t(`priority_${wo.priority}`));
	kv(b, t("label_planned_start"), formatWorkOrderDate(wo.plannedStart, rc));
	kv(b, t("label_planned_end"), formatWorkOrderDate(wo.plannedEnd, rc));
	kv(b, t("label_started"), formatWorkOrderDate(wo.startedAt, rc));
	kv(b, t("label_closed"), formatWorkOrderDate(wo.closedAt, rc));
	kv(b, t("label_duration"), duration(wo.startedAt, wo.closedAt, DASH));
	if (wo.status === "cancelled") {
		kv(b, t("label_cancellation_reason"), wo.cancellationReason);
	}
	if (wo.description) kv(b, t("label_description"), wo.description);

	if (wo.location) {
		section(b, t("section_location"));
		kv(b, t("label_site"), wo.location.name);
		kv(
			b,
			t("label_address"),
			joinComma(
				wo.location.address,
				wo.location.city,
				wo.location.state,
				wo.location.postalCode,
				wo.location.country,
			),
		);
	}

	section(b, t("section_parts"));
	if (wo.parts.length === 0) kv(b, DASH, t("no_parts"));
	for (const part of wo.parts) {
		kv(
			b,
			part.name,
			`SKU ${part.sku} · x${part.quantity} · ${t("parts_consumed")} ${part.consumed}`,
		);
	}

	section(b, t("section_assets"));
	if (wo.assets.length === 0) kv(b, DASH, t("no_assets"));
	for (const asset of wo.assets) {
		kv(b, asset.name, `${asset.serial} · ${asset.status}`);
	}

	if (wo.assignees.length > 0) {
		section(b, t("section_assignees"));
		for (const assignee of wo.assignees) {
			b.rows.push({ kind: "bullet", text: assignee });
		}
	}

	const blocks: ProcedureBlock[] = [
		...wo.procedures,
		...wo.assets.flatMap((asset) =>
			asset.procedures.map((block) => ({ ...block, assetName: asset.name })),
		),
	];

	if (blocks.length > 0) {
		section(b, t("section_procedures"));
		for (const block of blocks) {
			sub(
				b,
				block.assetName ? `${block.assetName} — ${block.name}` : block.name,
			);
			for (const field of block.fields) {
				await renderField(b, field, block.responses[field.id], rc);
			}
		}
	}

	return b;
};

const orgLines = (org: OrgData, rc: RenderCtx) =>
	nonEmpty(
		org.legalName,
		org.taxId ? rc.t("tax_id_prefix") + org.taxId : "",
		org.address,
		joinComma(org.city, org.state, org.postalCode, org.country),
		org.phone,
		org.email,
	);

const RowView = ({ row, striped }: { row: Row; striped: boolean }) => {
	const zebra = striped ? { backgroundColor: COLORS.mutedBg } : {};

	switch (row.kind) {
		case "section":
			return (
				<View style={styles.section} wrap={false} minPresenceAhead={40}>
					<Text style={styles.sectionText}>{row.text}</Text>
				</View>
			);
		case "sub":
			return (
				<View style={styles.sub} wrap={false} minPresenceAhead={40}>
					<Text style={styles.subText}>{row.text}</Text>
				</View>
			);
		case "kv":
			return (
				<View style={[styles.row, zebra]} wrap={false}>
					<Text style={styles.label}>{row.label}</Text>
					<Text style={styles.value}>{row.value}</Text>
				</View>
			);
		case "bullet":
			return (
				<View style={[styles.row, zebra]} wrap={false}>
					<Text style={styles.full}>{`•  ${row.text}`}</Text>
				</View>
			);
		case "fieldLabel":
			return (
				<View style={[styles.row, zebra]} wrap={false}>
					<Text style={[styles.full, styles.bold]}>{row.text}</Text>
				</View>
			);
		case "value":
			return (
				<View style={[styles.row, zebra]}>
					<Text style={styles.full}>{row.text}</Text>
				</View>
			);
		case "image":
			return (
				<View style={[styles.imageRow, zebra]} wrap={false}>
					<Image
						src={row.src}
						style={{
							height: row.height,
							objectFit: "contain",
							alignSelf: "flex-start",
						}}
					/>
				</View>
			);
	}
};

const striping = (rows: Row[]) => {
	let zebra = 0;
	return rows.map((row) => {
		if (row.kind === "section" || row.kind === "sub") {
			zebra = 0;
			return false;
		}
		zebra += 1;
		return zebra % 2 === 0;
	});
};

export const renderReport = async (
	org: OrgData,
	wo: WorkOrderData,
	logo: string | undefined,
	rc: RenderCtx,
) => {
	const { rows, warnings } = await buildRows(wo, rc);
	const striped = striping(rows);
	const title =
		wo.status === "cancelled"
			? rc.t("title_cancelled")
			: rc.t("title_completed");

	const document = (
		<Document title={`${title} #${wo.id}`}>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					{logo ? <Image src={logo} style={styles.logo} /> : null}
					<View>
						<Text style={styles.orgName}>{org.name}</Text>
						{orgLines(org, rc).map((line) => (
							<Text key={line} style={styles.orgLine}>
								{line}
							</Text>
						))}
					</View>
				</View>

				<Text style={styles.title}>{title}</Text>
				<Text style={styles.subtitle}>{wo.title}</Text>

				{rows.map((row, index) => (
					<RowView
						key={`${row.kind}-${index}`}
						row={row}
						striped={striped[index]}
					/>
				))}

				<Text
					style={styles.pageNumber}
					render={({ pageNumber, totalPages }) =>
						`${pageNumber} / ${totalPages}`
					}
					fixed
				/>
			</Page>
		</Document>
	);

	return { buffer: await renderToBuffer(document), warnings };
};
