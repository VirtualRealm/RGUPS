import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stage = path.join(root, ".public-build");
// Dedicated disposable staging directory; never move or remove source API routes.
if (path.dirname(stage) !== root || path.basename(stage) !== ".public-build")
  throw new Error("Unsafe build path");
await fs.rm(stage, { recursive: true, force: true });
await fs.mkdir(stage, { recursive: true });
for (const name of [
  "src",
  "public",
  "offline",
  "prisma",
  "vendor",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.mjs",
  "next-env.d.ts",
]) {
  await fs.cp(path.join(root, name), path.join(stage, name), {
    recursive: true,
    filter: (p) => p !== path.join(root, "src/app/api"),
  });
}
await fs.symlink(
  path.join(root, "node_modules"),
  path.join(stage, "node_modules"),
  process.platform === "win32" ? "junction" : "dir",
);
const result = spawnSync(
  process.execPath,
  [path.join(root, "node_modules/next/dist/bin/next"), "build"],
  {
    cwd: stage,
    stdio: "inherit",
    env: {
      ...process.env,
      PORTAL_STATIC_EXPORT: "1",
      PORTAL_BUILD_ROOT: root,
      NEXT_PUBLIC_PORTAL_DEMO: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
const out = path.join(root, "out");
if (path.dirname(out) !== root) throw new Error("Unsafe export path");
await fs.rm(out, { recursive: true, force: true });
await fs.cp(path.join(stage, "out"), out, { recursive: true });
console.log(
  "Public demo exported to out/. Server source and production build are preserved.",
);
