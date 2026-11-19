import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, "..", "public");

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const name = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([length, name, data, crc]);
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function makePixels(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4);
  const low = maskable ? 0.2 : 0.09;
  const high = maskable ? 0.8 : 0.91;
  const band = size * 0.045;

  const set = (x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const index = (y * size + x) * 4;
    pixels[index] = r;
    pixels[index + 1] = g;
    pixels[index + 2] = b;
    pixels[index + 3] = 255;
  };

  const outerMin = Math.round(size * low);
  const outerMax = Math.round(size * high);
  const innerMin = outerMin + Math.round(band);
  const innerMax = outerMax - Math.round(band);

  const triLeft = size * (low + 0.16);
  const triRight = size * (high - 0.13);
  const triTop = size * (low + 0.19);
  const triBottom = size * (high - 0.19);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 2;
      let g = 6;
      let b = 23;

      const inOuter =
        x >= outerMin && x <= outerMax && y >= outerMin && y <= outerMax;
      const inInner =
        x >= innerMin && x <= innerMax && y >= innerMin && y <= innerMax;

      if (inOuter && !inInner) {
        const t = x / size;
        r = Math.round(6 + 232 * t);
        g = Math.round(182 - 82 * t);
        b = Math.round(212 - 72 * t);
      }

      if (
        pointInTriangle(
          x,
          y,
          triLeft,
          triTop,
          triLeft,
          triBottom,
          triRight,
          (triTop + triBottom) / 2,
        )
      ) {
        const t = x / size;
        r = Math.round(236 - 40 * t);
        g = Math.round(254 - 120 * t);
        b = 255;
      }

      set(x, y, r, g, b);
    }
  }

  return pixels;
}

function makePng(size, maskable) {
  const pixels = makePixels(size, maskable);
  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));

  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, "icon-192.png"), makePng(192, false));
writeFileSync(resolve(publicDir, "icon-512.png"), makePng(512, false));
writeFileSync(resolve(publicDir, "icon-maskable-512.png"), makePng(512, true));
console.log("Generated PWA icons in public/");
