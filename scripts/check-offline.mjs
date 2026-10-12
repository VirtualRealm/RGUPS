import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";
import assert from "node:assert/strict";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.resolve(
  process.argv[2] || path.join(root, "../rgups-portal-demo.html"),
);
const html = readFileSync(file, "utf8");
const manifest = JSON.parse(
  readFileSync(file.replace(/\.html$/, ".manifest.json"), "utf8"),
);
assert.equal(Buffer.byteLength(html), manifest.bytes);
assert.ok(!/<script\b[^>]*\bsrc\s*=/i.test(html));
assert.ok(!/<link\b[^>]*\brel=["']stylesheet/i.test(html));
const scriptBlocks = [
  ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
];
assert.equal(scriptBlocks.length, 2);
const assets = JSON.parse(
  scriptBlocks.find((s) => s[1].includes("application/json"))[2],
);
for (const [url, data] of Object.entries(assets)) {
  assert.ok(data.startsWith("data:"));
  assert.deepEqual(
    Buffer.from(data.split(",")[1], "base64"),
    readFileSync(path.join(root, "public", url)),
    url,
  );
}
const script = scriptBlocks.find((s) => !s[1].includes("application/json"))[2];
new Script(script, { filename: "offline-portal.js" });
assert.equal(Object.keys(assets).filter((x) => x.endsWith(".pdf")).length, 9);
assert.equal(manifest.pages, 157);
assert.equal(manifest.interactiveRoutes, 30);
console.log(
  `Offline package OK: ${manifest.pages} pages, ${manifest.interactiveRoutes} interactive routes, ${Object.keys(assets).length} byte-identical embedded assets, JavaScript syntax valid. Browser interactions not verified.`,
);
