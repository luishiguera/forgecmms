import sharp from "sharp";
import * as storage from "../../storage";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 8 << 20;
const JPEG_QUALITY = 85;

export type EmbeddableImage = {
	data: Buffer;
	format: "png" | "jpeg";
};

const SIGNATURES: [Uint8Array, string][] = [
	[new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "png"],
	[new Uint8Array([0xff, 0xd8, 0xff]), "jpeg"],
	[new Uint8Array([0x47, 0x49, 0x46, 0x38]), "gif"],
];

export const detectFormat = (raw: Uint8Array) => {
	for (const [signature, format] of SIGNATURES) {
		if (signature.every((byte, index) => raw[index] === byte)) return format;
	}

	const text = Buffer.from(raw.subarray(0, 12)).toString("latin1");
	if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP") return "webp";

	return undefined;
};

const readBytes = async (url: string) => {
	const path = storage.pathOf(url);
	if (path) return await storage.download(path);

	const response = await fetch(url, {
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});
	if (!response.ok) throw new Error(`status ${response.status}`);

	return new Uint8Array(await response.arrayBuffer());
};

export const fetchImage = async (url: string) => {
	const raw = await readBytes(url);
	if (raw.byteLength > MAX_BYTES) throw new Error("image too large");
	if (!detectFormat(raw)) throw new Error("unrecognized image format");

	return raw;
};

export const toEmbeddable = async (
	raw: Uint8Array,
): Promise<EmbeddableImage> => {
	const image = sharp(raw);
	const metadata = await image.metadata();

	const photographic =
		metadata.format === "jpeg" ||
		metadata.space === "cmyk" ||
		(metadata.format === "webp" && !metadata.hasAlpha);

	if (photographic) {
		return {
			data: await image.jpeg({ quality: JPEG_QUALITY }).toBuffer(),
			format: "jpeg",
		};
	}

	const { data, info } = await image
		.ensureAlpha()
		.raw({ depth: "uchar" })
		.toBuffer({ resolveWithObject: true });

	return {
		data: await sharp(data, {
			raw: { width: info.width, height: info.height, channels: 4 },
		})
			.png({ palette: false, compressionLevel: 9 })
			.toBuffer(),
		format: "png",
	};
};

export const fetchEmbeddable = async (url: string) =>
	toEmbeddable(await fetchImage(url));

export const stripDataUrl = (value: string) => {
	const marker = value.indexOf("base64,");
	return marker >= 0 ? value.slice(marker + "base64,".length) : value;
};

export const dataUrlOf = ({ data, format }: EmbeddableImage) =>
	`data:image/${format};base64,${data.toString("base64")}`;
