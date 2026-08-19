export async function compressImage(
	file: File,
	maxDimension = 1600,
	quality = 0.75,
): Promise<File> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(url);
			const scale = Math.min(
				1,
				maxDimension / Math.max(img.width, img.height) || 1,
			);
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(img.width * scale);
			canvas.height = Math.round(img.height * scale);

			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Could not get canvas context"));
				return;
			}

			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						reject(new Error("Could not compress image"));
						return;
					}
					const name = file.name.replace(/\.[^/.]+$/, "");
					resolve(new File([blob], `${name}.webp`, { type: "image/webp" }));
				},
				"image/webp",
				quality,
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};

		img.src = url;
	});
}

export async function convertToWebP(file: File, quality = 0.8): Promise<File> {
	if (file.type === "image/webp") {
		return file;
	}

	return new Promise((resolve, reject) => {
		const img = new Image();
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;

			if (!ctx) {
				reject(new Error("Could not get canvas context"));
				return;
			}

			ctx.drawImage(img, 0, 0);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						reject(new Error("Could not convert image to WebP"));
						return;
					}

					const originalName = file.name.replace(/\.[^/.]+$/, "");
					const webpFile = new File([blob], `${originalName}.webp`, {
						type: "image/webp",
					});

					resolve(webpFile);
				},
				"image/webp",
				quality,
			);
		};

		img.onerror = () => {
			reject(new Error("Failed to load image"));
		};

		img.src = URL.createObjectURL(file);
	});
}
