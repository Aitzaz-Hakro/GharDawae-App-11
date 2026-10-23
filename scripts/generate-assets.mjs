// Generates the Ghar Dawae app icon, adaptive-icon layers and splash mark.
//
// Why a script: the mark is geometric (a house for "ghar", a tablet cross for
// "dawae"), so it is reproducible, reviewable and free of the fake-lettering
// risk that comes from asking an image model to draw text. Run with
//   node scripts/generate-assets.mjs
// Output goes to assets/images/. Nothing here runs at app build time.

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const TEAL = [12, 124, 112]; // #0C7C70 — theme primary
const CORAL = [242, 118, 78]; // #F2764E — theme accent
const WHITE = [255, 255, 255];
const CLEAR = [0, 0, 0, 0];

const SS = 4; // supersampling factor per axis

/** Paint an RGBA canvas described by a signed-distance-ish test function. */
function paint(size, background, shapes) {
  const px = new Uint8Array(size * size * 4);
  for (let i = 0; i < px.length; i += 4) {
    px[i] = background[0];
    px[i + 1] = background[1];
    px[i + 2] = background[2];
    px[i + 3] = background[3] ?? 255;
  }
  // Shapes are painted with analytic coverage (distance to edge in device px).
  for (const shape of shapes) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cov = shape.coverage(x + 0.5, y + 0.5);
        if (cov <= 0) continue;
        const i = (y * size + x) * 4;
        const a = Math.min(1, cov) * ((shape.color[3] ?? 255) / 255);
        const dstA = px[i + 3] / 255;
        const outA = a + dstA * (1 - a);
        if (outA <= 0) continue;
        for (let k = 0; k < 3; k++) {
          px[i + k] =
            (shape.color[k] * a + px[i + k] * dstA * (1 - a)) / outA;
        }
        px[i + 3] = Math.round(outA * 255);
      }
    }
  }
  return px;
}

/** Rounded rectangle with analytic anti-aliasing. */
function roundRect(cx, cy, w, h, r, color) {
  const hw = w / 2;
  const hh = h / 2;
  return {
    color,
    coverage(x, y) {
      const dx = Math.abs(x - cx) - (hw - r);
      const dy = Math.abs(y - cy) - (hh - r);
      let d;
      if (dx > 0 && dy > 0) d = Math.hypot(dx, dy) - r;
      else d = Math.max(dx, dy) - r;
      return clamp(0.5 - d);
    },
  };
}

/** Polygon via even-odd winding, anti-aliased by 2x2 sub-samples. */
function polygon(points, color) {
  return {
    color,
    coverage(x, y) {
      // 2x2 sub-sampling is plenty once the shape is already large.
      let hits = 0;
      for (const [ox, oy] of [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ]) {
        if (inside(points, x - 0.5 + ox, y - 0.5 + oy)) hits++;
      }
      return hits / 4;
    },
  };
}

function inside(poly, x, y) {
  let insideFlag = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) insideFlag = !insideFlag;
  }
  return insideFlag;
}

const clamp = (v) => Math.max(0, Math.min(1, v));

/** The mark: house roof + body, with a rounded medical cross inside. */
function mark(size, { ink, cross, withGround }) {
  const u = size / 100; // design units: 100x100
  const shapes = [];
  if (withGround) {
    shapes.push(roundRect(size / 2, size / 2, size, size, size * 0.22, withGround));
  }
  // Roof
  shapes.push(
    polygon(
      [
        [50 * u, 20 * u],
        [84 * u, 46 * u],
        [74 * u, 46 * u],
        [50 * u, 28.5 * u],
        [26 * u, 46 * u],
        [16 * u, 46 * u],
      ],
      ink,
    ),
  );
  // Body
  shapes.push(roundRect(50 * u, 66 * u, 60 * u, 38 * u, 5 * u, ink));
  // Cross (vertical + horizontal bars)
  shapes.push(roundRect(50 * u, 66 * u, 9 * u, 24 * u, 4 * u, cross));
  shapes.push(roundRect(50 * u, 66 * u, 24 * u, 9 * u, 4 * u, cross));
  return shapes;
}

function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0, 0);
    return Buffer.concat([len, body, crc]);
  };

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

let CRC_TABLE;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

function write(path, size, background, shapes) {
  const px = paint(size, background, shapes);
  writeFileSync(path, encodePng(size, px));
  console.log(`wrote ${path} (${size}x${size})`);
}

const OUT = "assets/images";

// App icon: solid teal ground, white house, coral cross.
write(`${OUT}/icon.png`, 1024, [...TEAL, 255], mark(1024, {
  ink: [...WHITE, 255],
  cross: [...CORAL, 255],
  withGround: null,
}));

// Adaptive icon: background layer is the ground, foreground is the mark scaled
// into the 66% safe zone, monochrome is a white silhouette for themed icons.
write(`${OUT}/android-icon-background.png`, 1024, [...TEAL, 255], []);

const fgSize = 1024;
{
  const shapes = mark(fgSize, {
    ink: [...WHITE, 255],
    cross: [...CORAL, 255],
    withGround: null,
  }).map((s) => {
    // Scale about the centre by 1/1.45 to sit inside the adaptive safe zone.
    const scaled = { ...s };
    const cov = s.coverage;
    scaled.coverage = (x, y) => {
      const cx = fgSize / 2;
      const cy = fgSize / 2;
      return cov(cx + (x - cx) * 1.45, cy + (y - cy) * 1.45);
    };
    return scaled;
  });
  write(`${OUT}/android-icon-foreground.png`, fgSize, CLEAR, shapes);
}

write(
  `${OUT}/android-icon-monochrome.png`,
  1024,
  CLEAR,
  mark(1024, {
    ink: [...WHITE, 255],
    cross: [...WHITE, 255],
    withGround: null,
  }).map((s) => {
    const cov = s.coverage;
    return {
      color: s.color,
      coverage: (x, y) => cov(512 + (x - 512) * 1.45, 512 + (y - 512) * 1.45),
    };
  }),
);

// Splash: transparent mark; the plugin paints the teal ground behind it.
write(
  `${OUT}/splash-icon.png`,
  1024,
  CLEAR,
  mark(1024, { ink: [...WHITE, 255], cross: [...CORAL, 255], withGround: null }),
);

write(`${OUT}/favicon.png`, 64, [...TEAL, 255], mark(64, {
  ink: [...WHITE, 255],
  cross: [...CORAL, 255],
  withGround: null,
}));
