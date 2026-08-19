import { Algorithm, hash, verify } from "@node-rs/argon2";

const options = {
	algorithm: Algorithm.Argon2id,
	memoryCost: 64 * 1024,
	timeCost: 3,
	parallelism: 4,
	outputLen: 32,
	saltLength: 16,
};

export const hashPassword = (plain: string) => hash(plain, options);

export const verifyPassword = async (plain: string, encoded: string) => {
	if (!encoded) return false;
	try {
		return await verify(encoded, plain);
	} catch {
		return false;
	}
};
