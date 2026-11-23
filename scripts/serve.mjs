import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end("Method Not Allowed");
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400).end("Bad Request"); return; }
  if (pathname === "/") pathname = "/index.html";
  const file = resolve(root, "." + pathname);
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not a file");
    res.writeHead(200, {
      "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": pathname === "/sw.js" ? "no-cache" : "no-store",
    });
    if (req.method === "HEAD") res.end();
    else createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not Found");
  }
});
server.listen(port, "127.0.0.1", () => {
  const address = server.address();
  process.stdout.write(`Quran PWA local server: http://127.0.0.1:${address.port}\n`);
});
