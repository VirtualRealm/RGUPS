import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
const root = path.resolve("out");
const pages = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (p.endsWith(".html")) pages.push(p);
  }
}
walk(root);
const missing = new Set();
let checked = 0;
for (const file of pages) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const target = decodeURIComponent(match[1].split(/[?#]/)[0]);
    if (target.startsWith("//")) continue;
    const local = path.join(root, target);
    checked++;
    if (existsSync(local) && statSync(local).isFile()) continue;
    if (existsSync(path.join(local, "index.html"))) continue;
    missing.add(path.relative(root, file) + " -> " + target);
  }
}
if (missing.size) {
  console.error([...missing].join("\n"));
  process.exit(1);
}
console.log(
  "Static export OK: " +
    pages.length +
    " HTML pages; " +
    checked +
    " internal links/assets resolved.",
);
