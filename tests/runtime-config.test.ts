import test from "node:test";
import assert from "node:assert/strict";
import { productionConfigIssues } from "../src/server/runtime-config.mjs";
const valid = {
  APP_URL: "https://portal.example.org",
  DATABASE_URL: "postgresql://portal:local_fixture_only_123@db:5432/portal",
  MAIL_MODE: "smtp",
  SMTP_HOST: "smtp.example.org",
  SMTP_FROM: "Portal <portal@example.org>",
  SMTP_PORT: "587",
  SMTP_USER: "fixture",
  SMTP_PASSWORD: "fixture-password",
  TRUST_PROXY: "1",
};
test("production registration requires a real server, HTTPS and configured mail", () => {
  assert.deepEqual(productionConfigIssues(valid), []);
  for (const change of [
    { APP_URL: "http://127.0.0.1:3000" },
    { APP_URL: "https://portal.example.org/wrong/path" },
    { MAIL_MODE: "local" },
    { SMTP_HOST: "" },
    { SMTP_FROM: "" },
    { SMTP_PASSWORD: "" },
    { SMTP_PORT: "NaN" },
    { DATABASE_URL: "postgresql://portal:local_dev_change_me@db:5432/portal" },
    { NEXT_PUBLIC_PORTAL_DEMO: "1" },
  ])
    assert(
      productionConfigIssues({ ...valid, ...change }).length,
      JSON.stringify(change),
    );
});
test("configuration diagnostics never return submitted secret values", () => {
  const secret = "private:password@invalid space";
  const result = JSON.stringify(
    productionConfigIssues({
      ...valid,
      DATABASE_URL: secret,
      SMTP_PASSWORD: secret,
      SMTP_USER: "",
    }),
  );
  assert(!result.includes(secret));
});
