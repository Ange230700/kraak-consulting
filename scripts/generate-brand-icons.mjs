#!/usr/bin/env node
/**
 * Génère les icônes dérivées (favicons, icônes PWA, icônes lanceur Android)
 * à partir des sources de marque `kraak-symbol.png` et `kraak-logo.png`
 * présentes dans `apps/client/projects/web/public/` et
 * `apps/client/projects/mobile/public/`.
 *
 * Usage : `node scripts/generate-brand-icons.mjs`
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const repoRoot = path.resolve(import.meta.dirname, '..');

const BRAND_NAVY = { r: 0x12, g: 0x2b, b: 0x4a, alpha: 1 };

const projects = [
  path.join(repoRoot, 'apps', 'client', 'projects', 'web', 'public'),
  path.join(repoRoot, 'apps', 'client', 'projects', 'mobile', 'public'),
];

const faviconPngSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
];

async function symbolOnTransparent(sourcePath, size) {
  return sharp(sourcePath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function symbolOnBrand(sourcePath, size, padding = 0.18) {
  const inner = Math.round(size * (1 - padding * 2));
  const symbolBuffer = await sharp(sourcePath)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND_NAVY,
    },
  })
    .composite([{ input: symbolBuffer, gravity: 'center' }])
    .png()
    .toBuffer();
}

/**
 * Construit un fichier ICO multi-tailles (16, 32, 48) à partir d'images PNG.
 * Format ICO : header (6 octets) + entrées (16 octets) + données PNG.
 */
function buildIcoFile(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(count, 4);

  const entries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  for (let index = 0; index < count; index += 1) {
    const { size, buffer } = pngBuffers[index];
    const entryOffset = index * 16;
    entries.writeUInt8(size === 256 ? 0 : size, entryOffset + 0); // width
    entries.writeUInt8(size === 256 ? 0 : size, entryOffset + 1); // height
    entries.writeUInt8(0, entryOffset + 2); // colors
    entries.writeUInt8(0, entryOffset + 3); // reserved
    entries.writeUInt16LE(1, entryOffset + 4); // planes
    entries.writeUInt16LE(32, entryOffset + 6); // bit count
    entries.writeUInt32LE(buffer.length, entryOffset + 8); // size
    entries.writeUInt32LE(offset, entryOffset + 12); // offset
    offset += buffer.length;
  }

  return Buffer.concat([header, entries, ...pngBuffers.map((entry) => entry.buffer)]);
}

async function generateForProject(publicDir) {
  const symbolPath = path.join(publicDir, 'kraak-symbol.png');
  if (!existsSync(symbolPath)) {
    throw new Error(`Source manquante : ${symbolPath}`);
  }

  for (const target of faviconPngSizes) {
    const buffer = await sharp(symbolPath)
      .resize(target.size, target.size, {
        fit: 'contain',
        background: { r: 0xff, g: 0xff, b: 0xff, alpha: 1 },
      })
      .png()
      .toBuffer();
    writeFileSync(path.join(publicDir, target.name), buffer);
  }

  const icoSizes = [16, 32, 48];
  const icoPngs = await Promise.all(
    icoSizes.map(async (size) => ({
      size,
      buffer: await symbolOnTransparent(symbolPath, size),
    })),
  );
  writeFileSync(path.join(publicDir, 'favicon.ico'), buildIcoFile(icoPngs));
}

const androidMipmaps = [
  { dir: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { dir: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { dir: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { dir: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

async function generateAndroidLauncherIcons() {
  const symbolPath = path.join(
    repoRoot,
    'apps',
    'client',
    'projects',
    'mobile',
    'public',
    'kraak-symbol.png',
  );
  const resRoot = path.join(repoRoot, 'apps', 'client', 'android', 'app', 'src', 'main', 'res');
  if (!existsSync(resRoot)) {
    return;
  }

  for (const entry of androidMipmaps) {
    const targetDir = path.join(resRoot, entry.dir);
    mkdirSync(targetDir, { recursive: true });

    const launcher = await symbolOnBrand(symbolPath, entry.launcher);
    writeFileSync(path.join(targetDir, 'ic_launcher.png'), launcher);

    const round = await sharp(launcher)
      .composite([
        {
          input: Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${entry.launcher}" height="${entry.launcher}"><rect x="0" y="0" width="${entry.launcher}" height="${entry.launcher}" rx="${entry.launcher / 2}" ry="${entry.launcher / 2}" fill="#000"/></svg>`,
          ),
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();
    writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), round);

    const foreground = await sharp(symbolPath)
      .resize(Math.round(entry.foreground * 0.66), Math.round(entry.foreground * 0.66), {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: Math.round(entry.foreground * 0.17),
        bottom: Math.round(entry.foreground * 0.17),
        left: Math.round(entry.foreground * 0.17),
        right: Math.round(entry.foreground * 0.17),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), foreground);
  }

  // Vérifie que le fond du launcher adaptatif utilise la couleur navy de marque.
  const backgroundXmlPath = path.join(resRoot, 'values', 'ic_launcher_background.xml');
  if (existsSync(backgroundXmlPath)) {
    const current = readFileSync(backgroundXmlPath, 'utf8');
    const updated = current.replace(
      /<color name="ic_launcher_background">#[0-9a-fA-F]+<\/color>/,
      '<color name="ic_launcher_background">#122B4A</color>',
    );
    if (updated !== current) {
      writeFileSync(backgroundXmlPath, updated);
    }
  }
}

async function main() {
  for (const publicDir of projects) {
    await generateForProject(publicDir);
  }
  await generateAndroidLauncherIcons();
  console.log('Icônes de marque régénérées avec succès.');
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
