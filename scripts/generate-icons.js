// Generates the extension's PNG icons from nothing but arithmetic — no SVG
// rasterizer, no image library. For each pixel we decide a color with plain
// geometry (rounded-rect + triangle/rect hit-tests), then hand-encode the
// result as a PNG ourselves (chunk framing, CRC32, and an uncompressed/
// "stored" DEFLATE stream — valid per the zlib/DEFLATE spec, just not
// space-optimal, which is irrelevant for icons this small).
import { writeFileSync, mkdirSync, existsSync } from 'fs';

// ── CRC32 (PNG chunk checksums) ─────────────────────────
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── Adler-32 (zlib stream checksum) ─────────────────────
function adler32(bytes) {
  let a = 1, b = 0;
  const MOD = 65521;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

function u32be(n) {
  return Buffer.from([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBytes, data]);
  return Buffer.concat([u32be(data.length), body, u32be(crc32(body))]);
}

/** DEFLATE "stored" (uncompressed) blocks — no Huffman coding needed. */
function deflateStored(data) {
  const MAX_BLOCK = 65535;
  const blocks = [];
  for (let offset = 0; offset < data.length || offset === 0; offset += MAX_BLOCK) {
    const slice = data.subarray(offset, offset + MAX_BLOCK);
    const isFinal = offset + MAX_BLOCK >= data.length;
    const len = slice.length;
    blocks.push(Buffer.from([isFinal ? 1 : 0]));
    blocks.push(Buffer.from([len & 0xff, (len >>> 8) & 0xff]));
    const nlen = len ^ 0xffff;
    blocks.push(Buffer.from([nlen & 0xff, (nlen >>> 8) & 0xff]));
    blocks.push(slice);
    if (data.length === 0) break;
  }
  return Buffer.concat(blocks);
}

function zlibWrap(data) {
  const header = Buffer.from([0x78, 0x01]); // CMF/FLG for deflate, 32K window
  return Buffer.concat([header, deflateStored(data), u32be(adler32(data))]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.concat([
    u32be(width),
    u32be(height),
    Buffer.from([8, 6, 0, 0, 0]), // 8-bit depth, RGBA, default compression/filter/interlace
  ]);

  // Raw scanlines: each row prefixed with filter-type 0 (None).
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const idat = zlibWrap(raw);

  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── Icon geometry: a rounded square with an "upload into backup" glyph ──
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function insideRoundedSquare(ux, uy, radius) {
  const cx = Math.min(Math.max(ux, radius), 1 - radius);
  const cy = Math.min(Math.max(uy, radius), 1 - radius);
  const dx = ux - cx;
  const dy = uy - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ux = (x + 0.5) / size;
      const uy = (y + 0.5) / size;
      const i = (y * size + x) * 4;

      if (!insideRoundedSquare(ux, uy, radius)) {
        rgba[i + 3] = 0; // transparent outside the rounded square
        continue;
      }

      const inShaft = ux >= 0.44 && ux <= 0.56 && uy >= 0.34 && uy <= 0.62;
      const inArrowhead = pointInTriangle(ux, uy, 0.5, 0.18, 0.32, 0.4, 0.68, 0.4);
      const inTray = ux >= 0.26 && ux <= 0.74 && uy >= 0.7 && uy <= 0.78;

      if (inShaft || inArrowhead || inTray) {
        rgba[i] = 255;
        rgba[i + 1] = 255;
        rgba[i + 2] = 255;
      } else {
        const t = (ux + uy) / 2;
        rgba[i] = Math.round(lerp(0x6f, 0x3d, t));
        rgba[i + 1] = Math.round(lerp(0xa3, 0x7d, t));
        rgba[i + 2] = Math.round(lerp(0xff, 0xf5, t));
      }
      rgba[i + 3] = 255;
    }
  }

  return encodePng(size, size, rgba);
}

if (!existsSync('public/icons')) mkdirSync('public/icons', { recursive: true });

for (const size of [16, 48, 128]) {
  writeFileSync(`public/icons/icon${size}.png`, renderIcon(size));
}
