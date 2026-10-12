import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const tsxRequire = createRequire(require.resolve("tsx"));
const { build } = tsxRequire("esbuild");
const output = path.resolve(
  process.argv[2] || path.join(root, "../rgups-portal-demo.html"),
);
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((f) =>
      f.isDirectory() ? walk(path.join(dir, f.name)) : [path.join(dir, f.name)],
    );
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const assets = {};
const mime = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};
for (const file of walk(path.join(root, "public"))) {
  const type = mime[path.extname(file)];
  if (!type) continue;
  assets[
    "/" + path.relative(path.join(root, "public"), file).replaceAll("\\", "/")
  ] = `data:${type};base64,${fs.readFileSync(file).toString("base64")}`;
}
const pages = {};
for (const file of walk(path.join(root, "out")).filter((f) =>
  f.endsWith(".html"),
)) {
  const source = fs.readFileSync(file, "utf8");
  const route =
    "/" +
    path
      .relative(path.join(root, "out"), file)
      .replaceAll("\\", "/")
      .replace(/(?:\/?index)?\.html$/, "");
  let html = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  if (!html) continue;
  html = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(
      /<iframe\b[^>]*>[\s\S]*?<\/iframe>/g,
      '<div class="offline-map"><strong>Воронеж · ул. Урицкого, 75а</strong><p>Адрес филиала сохранён. Интерактивная карта и построение маршрута доступны при подключении к интернету.</p></div>',
    )
    .replace(/\bsrc="(\/[^\"]+)"/g, (all, url) =>
      assets[url] ? `src="${assets[url]}"` : all,
    );
  pages[route] = {
    title: source.match(/<title>(.*?)<\/title>/)?.[1] || "РГУПС · Воронеж",
    html,
  };
}
const app = path.join(root, "src/app");
for (const [route, page] of Object.entries(pages)) {
  for (const match of page.html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const target =
      decodeURIComponent(match[1].split(/[?#]/)[0]).replace(/\/$/, "") || "/";
    if (!target.startsWith("//") && !pages[target] && !assets[target])
      throw new Error(`Offline link not bundled: ${route} -> ${target}`);
  }
  if (/<(?:iframe|script)\b/i.test(page.html))
    throw new Error(`Active external embed in ${route}`);
}
const interactivePages = walk(app).filter(
  (f) =>
    f.endsWith(`${path.sep}page.tsx`) &&
    !f.includes("[") &&
    !f.endsWith(`${path.sep}contacts${path.sep}page.tsx`),
);
const routesSource =
  interactivePages
    .map((f, i) => `import P${i} from ${JSON.stringify(f)};`)
    .join("\n") +
  "\nexport default {" +
  interactivePages
    .map(
      (f, i) =>
        `${JSON.stringify("/" + path.relative(app, path.dirname(f)).replaceAll("\\", "/"))}:P${i}`,
    )
    .join(",") +
  "};";
const result = await build({
  absWorkingDir: root,
  entryPoints: ["offline/entry.jsx"],
  bundle: true,
  write: false,
  minify: true,
  platform: "browser",
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_PORTAL_DEMO": '"1"',
  },
  alias: {
    "next/link": path.join(root, "offline/link.jsx"),
    "next/image": path.join(root, "offline/image.jsx"),
    "next/navigation": path.join(root, "offline/navigation.jsx"),
  },
  plugins: [
    {
      name: "offline-pages",
      setup(builder) {
        builder.onResolve({ filter: /^offline-(pages|routes)$/ }, (args) => ({
          path: args.path,
          namespace: "offline",
        }));
        builder.onLoad({ filter: /.*/, namespace: "offline" }, (args) => ({
          contents:
            args.path === "offline-routes"
              ? routesSource
              : `export default ${json(pages)}`,
          loader: "js",
          resolveDir: root,
        }));
      },
    },
  ],
  logLevel: "warning",
});
const css = walk(path.join(root, "out/_next/static"))
  .filter((f) => f.endsWith(".css"))
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");
if (/url\(\s*["']?(?:https?:|\/)/.test(css))
  throw new Error("External CSS asset must be embedded");
const extraCss = `.offline-banner{background:#20252a;color:#fff;font-size:12px;padding:10px 0}.offline-banner>.container{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.offline-banner details{margin-left:auto;max-width:700px}.offline-banner details p{line-height:1.7;padding:12px 0}.offline-map{padding:70px 30px;background:#edf0f2;min-height:320px;display:grid;align-content:center;gap:20px}.offline-map strong{font-size:24px}#main:focus{outline:none}@media(max-width:600px){.offline-banner details{margin-left:0}}`;
const script = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const document = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>РГУПС · Воронеж — локальная демонстрация</title><link rel="icon" href="${assets["/favicon.svg"]}"><style>${css}\n${extraCss}</style></head><body><div id="root"></div><noscript>Для интерактивной демонстрации включите JavaScript в браузере.</noscript><script id="portal-assets" type="application/json">${json(assets)}</script><script>${script}</script></body></html>`;
fs.writeFileSync(output, document);
const report = {
  output,
  bytes: Buffer.byteLength(document),
  pages: Object.keys(pages).length,
  interactiveRoutes: interactivePages.length,
  pdfs: Object.keys(assets).filter((x) => x.endsWith(".pdf")).length,
  assets: Object.keys(assets).length,
};
fs.writeFileSync(
  output.replace(/\.html$/, ".manifest.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
