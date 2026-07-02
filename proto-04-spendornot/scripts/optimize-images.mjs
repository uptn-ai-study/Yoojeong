import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const IMAGES_DIR = path.resolve('public/images');
const MAX_WIDTH = 960;
const WEBP_QUALITY = 72;
const APP_ICON_SOURCE = path.resolve('spendornot_icon_global.png');
const APP_ICON_OUTPUT = path.join(IMAGES_DIR, 'app-icon.webp');
const APP_ICON_SIZE = 256;
const APP_ICON_QUALITY = 82;

async function optimizeAppIcon() {
  await sharp(APP_ICON_SOURCE)
    .resize(APP_ICON_SIZE, APP_ICON_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .webp({ quality: APP_ICON_QUALITY, effort: 6 })
    .toFile(APP_ICON_OUTPUT);

  const { size } = await stat(APP_ICON_OUTPUT);
  console.log(
    `spendornot_icon_global.png → app-icon.webp (${(size / 1024).toFixed(1)} KB, ${APP_ICON_SIZE}px)`,
  );
}

const files = (await readdir(IMAGES_DIR)).filter((name) => name.endsWith('.png'));

for (const file of files) {
  const inputPath = path.join(IMAGES_DIR, file);
  const outputPath = path.join(IMAGES_DIR, file.replace(/\.png$/, '.webp'));

  await sharp(inputPath)
    .resize(MAX_WIDTH, null, { withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(outputPath);

  await unlink(inputPath);
  const { size } = await stat(outputPath);
  console.log(`${file} → ${path.basename(outputPath)} (${(size / 1024).toFixed(0)} KB)`);
}

await optimizeAppIcon();

console.log('\nDone. Original PNG files removed.');
