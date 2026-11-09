import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const read = (path) => readFile(new URL("../" + path, import.meta.url));
const expectedQuranHash = "9cf746b2c7501b4497d5db95589b99feab1e641a04bf1856c55a74cba39ecbf3";
const quran = await read("data/quran-uthmani.txt");
const hash = createHash("sha256").update(quran).digest("hex");
assert.equal(hash, expectedQuranHash, "Quran source text hash must remain unchanged");

const pages = JSON.parse(await read("data/mushaf-pages.json"));
assert.equal(pages.pages.length, 604, "Madinah Mushaf must contain 604 pages");
assert.equal(pages.juz.length, 30, "Quran data must contain 30 juz");

const adhkar = JSON.parse(await read("data/adhkar-morning-evening.json"));
assert.ok(Array.isArray(adhkar) && adhkar.length > 0, "Adhkar dataset must be a non-empty array");
assert.ok(adhkar.every((item) => item && typeof item.text === "string" && item.text.trim()), "Every dhikr entry must contain text");

const manifest = JSON.parse(await read("manifest.webmanifest"));
assert.equal(manifest.lang, "ar");
assert.equal(manifest.dir, "rtl");
assert.equal(manifest.display, "standalone");
assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));

const html = (await read("index.html")).toString("utf8");
for (const asset of ["./app.js", "./features.js", "./styles.css", "./manifest.webmanifest"]) {
  assert.ok(html.includes(asset), `index.html must reference ${asset}`);
}
assert.ok(html.includes('id="qibla"') && html.includes('id="prayer"'), "Qibla and prayer screens must exist");

const vercel = JSON.parse(await read("vercel.json"));
assert.equal(vercel.outputDirectory, ".");
assert.ok(vercel.headers.some((entry) => entry.source === "/sw.js"), "Service worker must have explicit cache headers");

for (const path of ["app.js", "features.js", "sw.js", "scripts/make-icons.mjs", "scripts/serve.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", new URL("../" + path, import.meta.url).pathname], { encoding: "utf8" });
  assert.equal(result.status, 0, `JavaScript syntax check failed for ${path}: ${result.stderr}`);
}

// البسملة: نص Tanzil يضمّها في الآية الأولى من 112 سورة (عدا الفاتحة والتوبة)، فلا يجوز أن يضيف العارض بسملة ثانية.
const lines = quran.toString("utf8").split(/\r?\n/).filter(Boolean).map((l) => l.split("|"));
const strip = (t) => t.replace(/[ً-ٰٟـ\s]/g, "").replace(/[ٱأإآ]/g, "ا");
const BASMALA = strip("بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ");
const withBasmala = lines.filter(([s, a, t]) => a === "1" && strip(t).startsWith(BASMALA)).map(([s]) => Number(s));
assert.equal(withBasmala.length, 113, "Tanzil text embeds the basmala in ayah 1 of 113 surahs (including Al-Fatiha)");
assert.ok(!withBasmala.includes(9), "At-Tawbah has no basmala");
const appJs = (await read("app.js")).toString("utf8");
assert.ok(appJs.includes("splitBasmala"), "Reader must split the embedded basmala instead of adding a second one");
assert.ok(!appJs.includes('<p class="basmala">بِسْمِ'), "Reader must not hard-code an extra basmala line");

console.log("PASS: single basmala per surah, Quran SHA-256, 604 pages, 30 juz, adhkar, manifest, app routes, Vercel headers, and JavaScript syntax.");
