import { createPresentation } from './presentation.mjs';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { escapeHtml } from './model.mjs';
export async function loadImages(document, source) {
  if (!document.images.length) return [];
  if (!source)
    throw new Error('Le chemin source est requis pour les illustrations.');
  const root = await realpath(process.cwd());
  const { default: sharp } = await import('sharp');
  return Promise.all(
    document.images.map(async (image) => {
      if (/^[a-z][a-z\d+.-]*:|^[/\\]{2}/i.test(image.href)) {
        throw new Error(`Illustration non locale interdite : ${image.href}`);
      }
      const imagePath = await realpath(
        path.resolve(path.dirname(source), decodeURIComponent(image.href)),
      );
      const relative = path.relative(root, imagePath);
      if (
        relative === '..' ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
      ) {
        throw new Error(`Illustration hors du dépôt : ${image.href}`);
      }
      const { data, info } = await sharp(await readFile(imagePath))
        .png()
        .toBuffer({ resolveWithObject: true });
      return {
        ...image,
        data: `data:image/png;base64,${data.toString('base64')}`,
        width: info.width,
        height: info.height,
      };
    }),
  );
}

export async function renderPdf(document, destination, images) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route('**/*', (route) => route.abort());
    const html = document.html
      .replace(/<img data-export-image="(\d+)"[^>]*>/g, (_, index) => {
        const image = images[Number(index)];
        return `<figure><img src="${image.data}" alt="${escapeHtml(image.title)}"><figcaption>${escapeHtml(image.title)}</figcaption></figure>`;
      })
      .replace(/<figure data-export-diagram="([^"]+)"><\/figure>/g, (_, id) => {
        const image = images.find((entry) => entry.id === id);
        if (!image) throw new Error(`Ressource Mermaid manquante : ${id}`);
        return `<figure><img src="${image.data}" alt="${escapeHtml(image.description || image.title)}"><figcaption>${escapeHtml(image.title)}</figcaption></figure>`;
      });
    await page.setContent(
      `<!doctype html><html lang="${document.language}"><head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
      <title>${escapeHtml(document.title)}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font: 11pt/1.5 Arial, sans-serif; color: #182b3a; }
        h1, h2, h3 { break-after: avoid; line-height: 1.2; }
        h1 { color: #173e50; } a { color: #173e50; overflow-wrap: anywhere; }
        pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: 12px; background: #f2f5f6; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #aab6bd; padding: 6px; overflow-wrap: anywhere; }
        tr { break-inside: avoid; } blockquote { border-left: 3px solid #aab6bd; padding-left: 12px; }
        figure { break-inside: avoid; margin: 12px 0; } img { max-width: 100%; max-height: 230mm; }
      </style></head><body>${html}</body></html>`,
      { waitUntil: 'load' },
    );
    await page.pdf({ path: destination, printBackground: true, tagged: true });
  } finally {
    await browser.close();
  }
}

export async function renderPptx(document, destination, images) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const presentation = new PptxGenJS();
  presentation.layout = 'LAYOUT_WIDE';
  presentation.author = 'KRAAK';
  presentation.subject = 'Export documentaire';
  presentation.title = document.title;
  presentation.lang = document.language;
  const spec = createPresentation(document, images);
  for (const [index, page] of spec.slides.entries()) {
    const slide = presentation.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText(page.title, {
      x: 0.6,
      y: 0.35,
      w: 12.1,
      h: 1.1,
      fontFace: 'Arial',
      fontSize: 26,
      bold: true,
      color: '173E50',
      fit: 'shrink',
    });
    if (page.kind === 'table') {
      slide.addTable(page.rows, {
        x: 0.6,
        y: 1.6,
        w: 12.1,
        h: 4.8,
        fontFace: 'Arial',
        fontSize: 16,
        color: '182B3A',
        border: { pt: 1, color: 'AAB6BD' },
        margin: 6,
        autoPage: false,
      });
    } else if (page.kind === 'image') {
      const image = images[page.imageIndex];
      const scale = Math.min(12.1 / image.width, 5.4 / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      slide.addImage({
        data: image.data,
        x: (13.333 - w) / 2,
        y: 1.5 + (5.4 - h) / 2,
        w,
        h,
        altText: image.description || image.title,
      });
    } else {
      slide.addText(page.text, {
        x: 0.6,
        y: 1.6,
        w: 12.1,
        h: 5,
        fontFace: 'Arial',
        fontSize: 18,
        color: '182B3A',
        margin: 0,
        fit: 'shrink',
      });
    }
    slide.addText(`KRAAK · ${index + 1} / ${spec.slides.length}`, {
      x: 0.6,
      y: 7,
      w: 12.1,
      h: 0.2,
      fontSize: 10,
      color: '526774',
    });
    slide.addNotes(page.notes);
  }
  await presentation.writeFile({ fileName: destination });
  return spec;
}
