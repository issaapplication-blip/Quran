import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createHash } from "node:crypto";

const port = 4179;
const child = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
child.stdout.on("data", (chunk) => { logs += chunk; });
child.stderr.on("data", (chunk) => { logs += chunk; });

try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    if (child.exitCode !== null) throw new Error(logs || "Local server exited unexpectedly");
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await delay(150);
  }
  assert.ok(ready, "Local static server did not become ready");

  const base = `http://127.0.0.1:${port}`;
  const checks = [
    ["/", "text/html"],
    ["/styles.css", "text/css"],
    ["/app.js", "javascript"],
    ["/features.js", "javascript"],
    ["/sw.js", "javascript"],
    ["/manifest.webmanifest", "application/manifest+json"],
    ["/assets/icon.svg", "image/svg+xml"],
    ["/assets/mushaf-icon.png", "image/png"],
    ["/assets/icon-192.png", "image/png"],
    ["/assets/icon-512.png", "image/png"],
    ["/assets/maskable-512.png", "image/png"],
    ["/assets/apple-touch-icon.png", "image/png"],
    ["/data/quran-uthmani.txt", "text/plain"],
    ["/data/mushaf-pages.json", "application/json"],
    ["/data/adhkar-morning-evening.json", "application/json"],
    ["/data/TANZIL-NOTICE.txt", "text/plain"],
    ["/data/ADHKAR-SOURCE.txt", "text/plain"],
  ];

  for (const [path, expectedType] of checks) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, `${path} should return HTTP 200`);
    assert.ok(response.headers.get("content-type")?.includes(expectedType), `${path} has unexpected content type`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.ok(bytes.length > 0, `${path} must not be empty`);
    if (path === "/data/quran-uthmani.txt") {
      const digest = createHash("sha256").update(bytes).digest("hex");
      assert.equal(digest, "9cf746b2c7501b4497d5db95589b99feab1e641a04bf1856c55a74cba39ecbf3");
    }
  }

  const sw = await fetch(base + "/sw.js");
  assert.equal(sw.headers.get("cache-control"), "no-cache");
  console.log(`PASS: ${checks.length} local HTTP smoke checks, content types, generated icons, and Quran SHA-256.`);
} finally {
  child.kill("SIGTERM");
}
