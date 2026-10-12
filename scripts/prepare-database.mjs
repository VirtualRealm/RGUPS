import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
for (const [name, args] of [
  ["prisma/build/index.js", ["migrate", "deploy"]],
  ["tsx/cli", ["prisma/seed.ts"]],
]) {
  const r = spawnSync(process.execPath, [require.resolve(name), ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (r.error) {
    console.error("Database preparation could not start");
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status || 1);
}
