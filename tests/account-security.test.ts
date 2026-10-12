import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  newToken,
  tokenHash,
  deviceLabel,
} from "../src/server/auth/crypto";
import { registrationSchema } from "../src/server/auth/validation";
test("Argon2id uses random salts, validates password and rejects malformed hashes", async () => {
  const password = "A long test-only password 2026";
  const a = await hashPassword(password),
    b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.match(a, /^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
  assert.ok(await verifyPassword(password, a));
  assert.equal(await verifyPassword("wrong", a), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(await verifyPassword(password, "broken"), false);
});
test("opaque session token is random and only its digest is stored", () => {
  const a = newToken(),
    b = newToken();
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.match(tokenHash(a), /^[a-f0-9]{64}$/);
  assert.notEqual(tokenHash(a), a);
});
test("registration cannot request privileged roles or smuggle owner IDs", () => {
  const base = {
    firstName: "Иван",
    lastName: "Иванов",
    birthDate: "2000-01-01",
    email: " Test@Example.org ",
    password: "strong enough password",
    requestedRole: "TEACHER",
  };
  const valid = registrationSchema.parse(base);
  assert.equal(valid.email, "test@example.org");
  assert.equal(
    registrationSchema.safeParse({ ...base, requestedRole: "ADMIN" }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...base, userId: "another" }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...base, requestedRole: "STUDENT" }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...base, birthDate: "2000-02-31" }).success,
    false,
  );
});
test("device labels omit raw user agent and do not fingerprint", () => {
  assert.equal(
    deviceLabel("Mozilla Windows Chrome/100 Edg/100 secret-value"),
    "Edge · Windows",
  );
  assert.equal(deviceLabel("unknown"), "Браузер · устройство");
});
