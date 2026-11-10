// Serves the web export (dist/) on 127.0.0.1:3000 for the Playwright checks, cross-origin
// isolated so SQLite's web build can run. Each route's own HTML, or index.html.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = new URL("../dist/", import.meta.url).pathname;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".svg": "image/svg+xml", ".wasm": "application/wasm", ".ttf": "font/ttf" };
const port = Number(process.env.PORT ?? 3000);

async function file(path) {
  const s = await stat(path).catch(() => null);
  return s?.isFile() ? path : null;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const base = join(root, rel);
  const found = (await file(base)) ?? (await file(`${base}.html`)) ?? (await file(join(base, "index.html"))) ?? join(root, "index.html");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Content-Type", types[extname(found)] ?? "application/octet-stream");
  res.end(await readFile(found));
}).listen(port, "127.0.0.1");
