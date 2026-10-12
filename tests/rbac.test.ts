import { test } from "node:test";
import assert from "node:assert/strict";
import { hasPermission } from "../src/server/policies/rbac";
test("deny by default and keep student/teacher out of administration", () => {
  assert.equal(hasPermission([], "users:manage"), false);
  assert.equal(
    hasPermission(["STUDENT", "TEACHER"], "education:manage"),
    false,
  );
});
test("editor cannot grant roles or access user management", () => {
  assert.equal(hasPermission(["EDITOR"], "content:write"), true);
  assert.equal(hasPermission(["EDITOR"], "users:manage"), false);
  assert.equal(hasPermission(["ADMIN"], "roles:grant"), false);
  assert.equal(hasPermission(["SUPER_ADMIN"], "roles:grant"), true);
});
