import { argon2, randomBytes, createHash, timingSafeEqual } from "node:crypto";
const parameters = { memory: 65536, passes: 3, parallelism: 1, tagLength: 32 };
function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) =>
    argon2(
      "argon2id",
      { ...parameters, message: password, nonce: salt },
      (error, hash) => (error ? reject(error) : resolve(hash)),
    ),
  );
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16),
    hash = await derive(password, salt);
  return `$argon2id$v=19$m=65536,t=3,p=1$${salt.toString("base64")}$${hash.toString("base64")}`;
}
export async function verifyPassword(password: string, encoded: string | null) {
  const parts = encoded?.split("$");
  const valid =
    parts?.length === 6 &&
    parts[1] === "argon2id" &&
    parts[2] === "v=19" &&
    parts[3] === "m=65536,t=3,p=1";
  const salt = valid ? Buffer.from(parts[4], "base64") : Buffer.alloc(16, 17);
  const expected = valid ? Buffer.from(parts[5], "base64") : Buffer.alloc(32);
  const actual = await derive(
    password,
    salt.length === 16 ? salt : Buffer.alloc(16, 17),
  );
  return Boolean(
    valid &&
    salt.length === 16 &&
    expected.length === actual.length &&
    timingSafeEqual(actual, expected),
  );
}
export function newToken() {
  return randomBytes(32).toString("base64url");
}
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function deviceLabel(agent: string) {
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Firefox\//.test(agent)
      ? "Firefox"
      : /Chrome\//.test(agent)
        ? "Chrome"
        : /Safari\//.test(agent)
          ? "Safari"
          : "Браузер";
  const os = /Android/.test(agent)
    ? "Android"
    : /iPhone|iPad/.test(agent)
      ? "iOS"
      : /Windows/.test(agent)
        ? "Windows"
        : /Macintosh/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : "устройство";
  return `${browser} · ${os}`;
}
