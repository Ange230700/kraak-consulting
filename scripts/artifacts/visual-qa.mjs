import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';
import { openPdf, normalizeText } from './verify.mjs';
import { atomicWrite, sha256, stableJson } from './identity.mjs';

const execute = promisify(execFile);
export function resolveOfficeExecutable(
  environment = process.env,
  platform = process.platform,
) {
  return (
    environment.LIBREOFFICE_PATH ??
    (platform === 'win32'
      ? path.join(
          environment.ProgramFiles ?? 'C:/Program Files',
          'LibreOffice/program/soffice.com',
        )
      : 'libreoffice')
  );
}
export async function visualQa({
  destination,
  format,
  output,
  spec,
  runOffice = execute,
  loadPdf = openPdf,
}) {
  if (!['pdf', 'pptx'].includes(format))
    throw new Error('La QA visuelle exige PDF ou PPTX.');
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'kraak-office-'));
  let pdf;
  try {
    let bytes = await readFile(destination);
    const inputSha256 = sha256(bytes);
    let converter = null;
    if (format === 'pptx') {
      const executable = resolveOfficeExecutable();
      const profile = `-env:UserInstallation=${pathToFileURL(path.join(temporary, 'profile')).href}`;
      try {
        const version = await runOffice(
          executable,
          [profile, '--headless', '--version'],
          { timeout: 30000, windowsHide: true },
        );
        converter = { name: 'LibreOffice', version: version.stdout.trim() };
        await runOffice(
          executable,
          [
            profile,
            '--headless',
            '--convert-to',
            'pdf',
            '--outdir',
            temporary,
            path.resolve(destination),
          ],
          { timeout: 120000, windowsHide: true },
        );
        bytes = await readFile(
          path.join(temporary, `${path.parse(destination).name}.pdf`),
        );
      } catch (error) {
        console.error(
          '[docs:visual-qa] Conversion LibreOffice impossible.',
          error.message,
        );
        throw new Error(
          'Installer LibreOffice ou définir LIBREOFFICE_PATH ; la vérification structurelle reste indépendante.',
          { cause: error },
        );
      }
    }
    pdf = await loadPdf(bytes);
    if (spec && pdf.numPages !== spec.slides.length)
      throw new Error(
        'QA visuelle : nombre de diapositives incorrect après conversion.',
      );
    await mkdir(output, { recursive: true });
    const pages = [];
    const thumbnails = [];
    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      await page.render({ canvasContext: canvas.getContext('2d'), viewport })
        .promise;
      const content = await page.getTextContent();
      const text = normalizeText(
        content.items.map((item) => item.str ?? '').join(' '),
      );
      if (spec) {
        const slide = spec.slides[index - 1];
        const expected = [
          slide.title,
          ...(slide.kind === 'table'
            ? slide.rows.flat()
            : slide.kind === 'text'
              ? [slide.text]
              : []),
        ];
        if (expected.some((entry) => !text.includes(normalizeText(entry))))
          throw new Error(
            `QA visuelle : texte perdu sur la diapositive ${index}.`,
          );
      }
      const png = canvas.toBuffer('image/png');
      const pixels = await sharp(png)
        .flatten({ background: '#ffffff' })
        .greyscale()
        .raw()
        .toBuffer();
      const ink =
        pixels.reduce((count, pixel) => count + (pixel < 235 ? 1 : 0), 0) /
        pixels.length;
      const outsideText = content.items.filter(
        (item) =>
          item.str?.trim() &&
          (item.transform[4] < -2 ||
            item.transform[5] < -2 ||
            item.transform[4] + item.width > page.view[2] + 2 ||
            item.transform[5] > page.view[3] + 2),
      ).length;
      const file = `${format === 'pptx' ? 'slides' : 'pages'}/${String(index).padStart(3, '0')}.png`;
      await atomicWrite(path.join(output, file), png);
      pages.push({
        number: index,
        file,
        width: canvas.width,
        height: canvas.height,
        sha256: sha256(png),
        inkRatio: ink,
        blank: ink < 0.0005,
        nearlyEmpty: ink < 0.005,
        outsideText,
      });
      thumbnails.push(
        await sharp(png)
          .resize(320, 450, { fit: 'contain', background: '#e5e7eb' })
          .png()
          .toBuffer(),
      );
    }
    const contactSheets = [];
    for (let offset = 0; offset < thumbnails.length; offset += 12) {
      const group = thumbnails.slice(offset, offset + 12);
      const sheet = await sharp({
        create: {
          width: 960,
          height: Math.ceil(group.length / 3) * 450,
          channels: 3,
          background: '#e5e7eb',
        },
      })
        .composite(
          group.map((input, index) => ({
            input,
            left: (index % 3) * 320,
            top: Math.floor(index / 3) * 450,
          })),
        )
        .png()
        .toBuffer();
      const file = `contact-sheet-${String(contactSheets.length + 1).padStart(3, '0')}.png`;
      await atomicWrite(path.join(output, file), sheet);
      contactSheets.push({ file, sha256: sha256(sheet) });
    }
    const report = {
      schemaVersion: 1,
      status: pages.some((page) => page.blank || page.outsideText)
        ? 'review-required'
        : 'passed',
      inputSha256,
      converter,
      pageCount: pages.length,
      pages,
      contactSheets,
      limitations: [
        'Les métriques automatiques ne prouvent pas une mise en page parfaite. Revue humaine des PNG requise.',
      ],
    };
    await atomicWrite(path.join(output, 'report.json'), stableJson(report));
    if (report.status !== 'passed')
      throw new Error(
        'QA visuelle : page vide ou texte hors limites ; consulter report.json.',
      );
    return report;
  } finally {
    if (pdf) await pdf.destroy();
    await rm(temporary, { recursive: true, force: true });
  }
}
