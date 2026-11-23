// يولّد أيقونات PNG للتطبيق دون أي مكتبة (zlib المدمج في Node فقط). يُشغَّل أثناء البناء: npm run build
// التصميم: مربع أخضر داكن + صفحة مصحف كريمية بإطار وخطوط ذهبية + ختم دائري أخضر في الوسط.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GREEN = [23, 79, 59], CREAM = [255, 254, 250], GOLD = [201, 164, 92];
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const t = Buffer.from(type), len = Buffer.alloc(4), sum = Buffer.alloc(4);
  len.writeUInt32BE(data.length); sum.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, sum]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      // تنعيم الحواف بأخذ ٤ عيّنات لكل بكسل
      let r = 0, g = 0, b = 0, a = 0;
      for (const [dx, dy] of [[.25, .25], [.75, .25], [.25, .75], [.75, .75]]) {
        const p = pixel((x + dx) / size, (y + dy) / size); // إحداثيات 0..1
        if (p) { r += p[0]; g += p[1]; b += p[2]; a += 1; }
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      if (a) { raw[o] = Math.round(r / a); raw[o + 1] = Math.round(g / a); raw[o + 2] = Math.round(b / a); raw[o + 3] = Math.round((a / 4) * 255); }
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const inRoundRect = (u, v, x0, y0, x1, y1, r) => {
  if (u < x0 || u > x1 || v < y0 || v > y1) return false;
  const cx = Math.min(Math.max(u, x0 + r), x1 - r), cy = Math.min(Math.max(v, y0 + r), y1 - r);
  return (u - cx) ** 2 + (v - cy) ** 2 <= r * r;
};
// scale: نسبة المحتوى داخل الأيقونة (القابلة للقناع تحتاج منطقة آمنة ≈٨٠٪)
function design({ rounded, scale }) {
  return (u, v) => {
    if (rounded ? !inRoundRect(u, v, 0, 0, 1, 1, 0.22) : false) return null;
    const x = (u - 0.5) / scale + 0.5, y = (v - 0.5) / scale + 0.5; // إحداثيات المحتوى
    const page = (a, b, c, d) => x >= a && x <= c && y >= b && y <= d;
    if (page(0.234, 0.225, 0.766, 0.775)) {
      if (!page(0.246, 0.237, 0.754, 0.763)) return GOLD;               // إطار ذهبي
      for (const ly of [0.31, 0.367, 0.656]) if (Math.abs(y - ly) < 0.0068 && x > 0.31 && x < 0.69) return GOLD; // أسطر
      const dx = x - 0.5, dy = y - 0.5;
      if (dx * dx + dy * dy <= 0.115 * 0.115 && dx * dx + dy * dy >= 0.075 * 0.075) return GREEN; // حلقة
      if (dx * dx + dy * dy <= 0.045 * 0.045) return GOLD;                                          // مركز
      return CREAM;
    }
    return GREEN;
  };
}
const out = fileURLToPath(new URL('../assets/', import.meta.url));
mkdirSync(out, { recursive: true });
const files = {
  'icon-192.png': png(192, design({ rounded: true, scale: 1 })),
  'icon-512.png': png(512, design({ rounded: true, scale: 1 })),
  'maskable-512.png': png(512, design({ rounded: false, scale: 0.78 })),
  'apple-touch-icon.png': png(180, design({ rounded: false, scale: 0.9 })),
};
for (const [n, b] of Object.entries(files)) { writeFileSync(out + n, b); console.log('assets/' + n, b.length, 'bytes'); }
