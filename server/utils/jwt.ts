import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export type JwtTokenType = "access" | "refresh";

export interface JwtPayload extends JWTPayload {
	typ?: JwtTokenType;
	profileId: string;
}

export interface JwtSignOptions {
	issuer?: string;
	audience?: string | string[];
	subject?: string;
	expiresIn?: string | number | Date;
}

export interface JwtVerifyOptions {
	issuer?: string;
	audience?: string | string[];
	clockTolerance?: string | number;
	expectedType?: JwtTokenType;
}

const encoder = new TextEncoder();
const DEFAULT_ACCESS_TTL = "15m";
const DEFAULT_REFRESH_TTL = "30d";

function getRequiredEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is not set`);
	}
	return value;
}

function parseAudience(value?: string): string | string[] | undefined {
	if (!value) return undefined;

	if (!value.includes(",")) return value;

	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function getJwtSecret(): Uint8Array {
	return encoder.encode(getRequiredEnv("JWT_SECRET"));
}

function resolveIssuer(override?: string): string | undefined {
	return override ?? process.env.JWT_ISSUER;
}

function resolveAudience(
	override?: string | string[],
): string | string[] | undefined {
	if (override) return override;

	return parseAudience(process.env.JWT_AUDIENCE);
}

function resolveAccessTtl(
	override?: string | number | Date,
): string | number | Date {
	return override ?? process.env.JWT_ACCESS_TTL ?? DEFAULT_ACCESS_TTL;
}

function resolveRefreshTtl(
	override?: string | number | Date,
): string | number | Date {
	return override ?? process.env.JWT_REFRESH_TTL ?? DEFAULT_REFRESH_TTL;
}

export function getBearerToken(value?: string | null): string | null {
	if (!value) return null;

	const [scheme, token] = value.trim().split(/\s+/u);
	if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;

	return token;
}

export async function signJwt(
	payload: JwtPayload,
	options: JwtSignOptions = {},
): Promise<string> {
	const issuer = resolveIssuer(options.issuer);
	const audience = resolveAudience(options.audience);

	const signer = new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuedAt();

	if (issuer) signer.setIssuer(issuer);
	if (audience) signer.setAudience(audience);
	if (options.subject) signer.setSubject(options.subject);
	if (options.expiresIn) signer.setExpirationTime(options.expiresIn);

	return signer.sign(getJwtSecret());
}

export async function signAccessToken(
	payload: JwtPayload,
	options: JwtSignOptions = {},
): Promise<string> {
	return signJwt(
		{ ...payload, typ: "access" },
		{
			...options,
			expiresIn: resolveAccessTtl(options.expiresIn),
		},
	);
}

export async function signRefreshToken(
	payload: JwtPayload,
	options: JwtSignOptions = {},
): Promise<string> {
	return signJwt(
		{ ...payload, typ: "refresh" },
		{
			...options,
			expiresIn: resolveRefreshTtl(options.expiresIn),
		},
	);
}

export async function verifyJwt<T extends JwtPayload = JwtPayload>(
	token: string,
	options: JwtVerifyOptions = {},
): Promise<T> {
	const issuer = resolveIssuer(options.issuer);
	const audience = resolveAudience(options.audience);

	const { payload } = await jwtVerify(token, getJwtSecret(), {
		algorithms: ["HS256"],
		issuer,
		audience,
		clockTolerance: options.clockTolerance,
	});

	if (options.expectedType && payload.typ !== options.expectedType) {
		throw new Error("Invalid token type");
	}

	return payload as T;
}

export async function verifyAccessToken<T extends JwtPayload = JwtPayload>(
	token: string,
	options: JwtVerifyOptions = {},
): Promise<T> {
	return verifyJwt<T>(token, { ...options, expectedType: "access" });
}

export async function verifyRefreshToken<T extends JwtPayload = JwtPayload>(
	token: string,
	options: JwtVerifyOptions = {},
): Promise<T> {
	return verifyJwt<T>(token, { ...options, expectedType: "refresh" });
}
