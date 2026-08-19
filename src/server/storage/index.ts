import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

const endpoint = process.env.STORAGE_ENDPOINT ?? "";
const region = process.env.STORAGE_REGION ?? "us-east-1";
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY ?? "";
const bucket = process.env.STORAGE_BUCKET ?? "";
const baseUrl = (process.env.BASE_URL ?? "").replace(/\/+$/, "");
const publicUrl = baseUrl && `${baseUrl}/storage`;

export const isConfigured = Boolean(
	endpoint && accessKeyId && secretAccessKey && bucket,
);

let client: S3Client | undefined;

const s3 = () => {
	if (!isConfigured) throw new Error("storage is not configured");
	client ??= new S3Client({
		region,
		endpoint,
		credentials: { accessKeyId, secretAccessKey },
		forcePathStyle: true,
	});
	return client;
};

export const upload = async (
	path: string,
	contentType: string,
	body: Uint8Array,
) => {
	if (!path.trim()) throw new Error("path is required");

	await s3().send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: path,
			Body: body,
			ContentType: contentType || undefined,
		}),
	);
};

export const download = async (path: string) => {
	if (!path.trim()) throw new Error("path is required");

	const object = await s3().send(
		new GetObjectCommand({ Bucket: bucket, Key: path }),
	);
	if (!object.Body) throw new Error("object has no body");

	return await object.Body.transformToByteArray();
};

export const remove = async (path: string) => {
	if (!path.trim()) throw new Error("path is required");

	await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: path }));
};

export const publicURL = (path: string) => {
	if (!publicUrl) throw new Error("public url is required");

	return `${publicUrl}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
};

export const pathOf = (url: string) => {
	const prefix = `${publicUrl}/`;

	return publicUrl && url.startsWith(prefix) ? url.slice(prefix.length) : "";
};
