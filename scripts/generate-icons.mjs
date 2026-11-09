/**
 * Geração de ícones PWA da FRAME FLOW.
 * Marcas: frame de cantos (canto superior direito em vermelho #e10606) +
 * triângulo "play" vermelho — herança audiovisual da FRAME VISION.
 * Executar: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });

const INK = "#0a0a0a";
const PAPER = "#f4f0e7";
const RED = "#e10606";

function iconSvg({ size, pad = 10, playScale = 1 }) {
  const p = size * (pad / 100);
  const s = size - p * 2;
  const c = s * 0.16;
  const t = Math.max(2, s * 0.045);

  const corner = (x, y, dx, dy, color) =>
    `<path d="M ${x + dx * c} ${y} H ${x} V ${y + dy * c}" stroke="${color}" stroke-width="${t}" fill="none" stroke-linecap="square"/>`;

  const pw = s * 0.34 * playScale;
  const ph = s * 0.4 * playScale;
  const px0 = size / 2 - pw / 2 + s * 0.02;
  const py0 = size / 2 - ph / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${INK}"/>
  ${corner(p, p, 1, 1, PAPER)}
  ${corner(p + s, p, -1, 1, RED)}
  ${corner(p, p + s, 1, -1, PAPER)}
  ${corner(p + s, p + s, -1, -1, PAPER)}
  <path d="M ${px0} ${py0} L ${px0 + pw} ${py0 + ph / 2} L ${px0} ${py0 + ph} Z" fill="${RED}"/>
</svg>`;
}

async function render(size, file, opts) {
  const buf = await sharp(Buffer.from(iconSvg({ size, ...opts })))
    .png()
    .toBuffer();
  writeFileSync(`${OUT}/${file}`, buf);
  console.log(`✓ ${OUT}/${file} (${size}x${size})`);
}

const jobs = [
  [192, "icon-192.png", { pad: 8 }],
  [512, "icon-512.png", { pad: 8 }],
  [512, "maskable-512.png", { pad: 24, playScale: 0.85 }],
  [180, "apple-touch-icon.png", { pad: 8 }],
];

for (const [size, file, opts] of jobs) await render(size, file, opts);

const favicon = iconSvg({ size: 64, pad: 8 });
writeFileSync("public/favicon.svg", favicon);
console.log("✓ public/favicon.svg");
console.log("Concluído.");
