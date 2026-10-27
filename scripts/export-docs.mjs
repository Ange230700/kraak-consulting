import { createHash, randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Marked } from 'marked';
import { decodeHTML } from 'entities';

import { createHeadingSlug } from './generate-markdown-tocs.mjs';

const formats = new Set(['pdf', 'pptx', 'txt', 'all']);
const markdown = new Marked({ gfm: true });

export function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index]?.replace(/^--/, '');
    if (!['source', 'format', 'output'].includes(name)) {
      throw new Error(`Option inconnue : ${args[index]}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--') || options[name]) {
      throw new Error(`Valeur manquante ou option répétée : ${args[index]}`);
    }
    options[name] = value;
  }
  if (!options.source || !formats.has(options.format)) {
    throw new Error(
      'Usage : pnpm docs:export --source README.md --format pdf|pptx|txt|all [--output dossier]',
    );
  }
  return options;
}

function inlineText(tokens = []) {
  return tokens
    .map((token) => {
      if (token.type === 'html') return '';
      if (token.type === 'br') return '\n';
      if (token.type === 'image')
        return `Illustration : ${decodeHTML(token.text)}`;
      if (token.tokens) return inlineText(token.tokens);
      return token.type === 'codespan'
        ? token.text
        : decodeHTML(token.text ?? '');
    })
    .join('');
}

function blockText(token) {
  switch (token.type) {
    case 'space':
    case 'html':
    case 'hr':
    case 'def':
      return '';
    case 'code': {
      const label = token.lang ? `Code (${token.lang})` : 'Code';
      return `${label} :\n${token.text}`;
    }
    case 'list':
      return token.items
        .map((item, index) => {
          const marker = token.ordered
            ? `${Number(token.start) + index}.`
            : '-';
          let checked = '';
          if (item.checked !== undefined)
            checked = item.checked ? '[x] ' : '[ ] ';
          return `${marker} ${checked}${item.tokens.map(blockText).filter(Boolean).join('\n')}`;
        })
        .join('\n');
    case 'blockquote':
      return token.tokens.map(blockText).filter(Boolean).join('\n\n');
    case 'table': {
      const headers = token.header.map((cell) => inlineText(cell.tokens));
      if (!token.rows.length) return headers.join(' / ');
      return token.rows
        .map((row) =>
          row
            .map(
              (cell, index) => `${headers[index]} : ${inlineText(cell.tokens)}`,
            )
            .join(' ; '),
        )
        .join('\n');
    }
    default:
      return inlineText(token.tokens ?? [token]);
  }
}

function stripFrontmatter(sourceText) {
  const body = sourceText.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  const lines = body.split('\n');
  if (lines[0] !== '---') return body;
  const end = lines.indexOf('---', 1);
  if (end === -1) return body;
  const entries = lines
    .slice(1, end)
    .filter((line) => line.trim() && !line.trimStart().startsWith('#'));
  if (
    !entries.length ||
    !entries.every((line) => /^[a-zA-Z_][\w-]*:[ \t]+\S.*$/.test(line))
  ) {
    return body;
  }
  return lines.slice(end + 1).join('\n');
}

function createSections(tokens, title) {
  const sections = [];
  let section;
  for (const token of tokens) {
    if (token.type === 'heading') {
      if (section) sections.push(section);
      section = { title: inlineText(token.tokens), text: '' };
    } else {
      const text = blockText(token);
      if (text) {
        section ??= { title, text: '' };
        section.text += `${section.text ? '\n\n' : ''}${text}`;
      }
    }
  }
  if (section) sections.push(section);
  return sections;
}

function containsMermaidBlock(tokens) {
  return tokens.some((token) => {
    if (token.type === 'code' && token.lang?.split(/\s/)[0] === 'mermaid') {
      return true;
    }
    if (token.tokens && containsMermaidBlock(token.tokens)) {
      return true;
    }
    return (
      token.type === 'list' &&
      token.items.some((item) => containsMermaidBlock(item.tokens))
    );
  });
}

export function createDocument(sourceText) {
  const tokens = markdown.lexer(stripFrontmatter(sourceText));
  const titleToken = tokens.find((token) => token.type === 'heading');
  const title = titleToken ? inlineText(titleToken.tokens) : 'Document KRAAK';
  const hasMermaid = containsMermaidBlock(tokens);
  const text = `${tokens.map(blockText).filter(Boolean).join('\n\n')}\n`;
  const images = [];
  const usedSlugs = new Set();
  const renderer = new Marked({
    gfm: true,
    renderer: {
      html: () => '',
      heading({ depth, text, tokens }) {
        const id = createHeadingSlug(text, usedSlugs);
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      image({ href, text }) {
        const title = decodeHTML(text) || 'Illustration';
        images.push({ href, title });
        return `<img data-export-image="${images.length - 1}" alt="${escapeHtml(title)}">`;
      },
    },
  });
  return {
    title,
    text,
    html: renderer.parser(tokens),
    images,
    sections: createSections(tokens, title),
    hasMermaid,
    sourceSha256: checksum(sourceText),
  };
}

function wrapParagraph(paragraph, width) {
  const lines = [];
  if (!paragraph.trim()) return [''];
  let line = '';
  for (const word of paragraph.trim().split(/\s+/)) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = '';
    }
    let remainder = word;
    while (remainder.length > width) {
      lines.push(remainder.slice(0, width));
      remainder = remainder.slice(width);
    }
    line += `${line ? ' ' : ''}${remainder}`;
  }
  if (line) lines.push(line);
  return lines;
}

export function paginateSections(sections) {
  return sections.flatMap((section) => {
    const lines = section.text
      .split('\n')
      .flatMap((paragraph) => wrapParagraph(paragraph, 80));
    const pages = [];
    for (let index = 0; index < Math.max(lines.length, 1); index += 12) {
      pages.push({
        title: section.title,
        continuation: index > 0,
        lines: lines.slice(index, index + 12),
      });
    }
    return pages;
  });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;');
}

async function loadImages(document, source) {
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

async function renderPdf(document, destination, images) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route('**/*', (route) => route.abort());
    const html = document.html.replace(
      /<img data-export-image="(\d+)"[^>]*>/g,
      (_, index) => {
        const image = images[Number(index)];
        return `<figure><img src="${image.data}" alt="${escapeHtml(image.title)}"><figcaption>${escapeHtml(image.title)}</figcaption></figure>`;
      },
    );
    await page.setContent(
      `<!doctype html><html lang="fr"><head>
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

async function renderPptx(document, destination, images) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const presentation = new PptxGenJS();
  presentation.layout = 'LAYOUT_WIDE';
  presentation.author = 'KRAAK';
  presentation.subject = 'Export documentaire';
  presentation.title = document.title;
  presentation.lang = 'fr-FR';
  const pages = paginateSections([
    { title: document.title, text: 'KRAAK — Export documentaire' },
    ...document.sections,
  ]);
  for (const [index, page] of pages.entries()) {
    const slide = presentation.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText(`${page.title}${page.continuation ? ' (suite)' : ''}`, {
      x: 0.6,
      y: 0.35,
      w: 12.1,
      h: 1.1,
      fontFace: 'Arial',
      fontSize: 26,
      bold: true,
      color: '173E50',
      breakLine: false,
      fit: 'shrink',
    });
    slide.addText(page.lines.join('\n'), {
      x: 0.6,
      y: 1.6,
      w: 12.1,
      h: 5,
      fontFace: 'Arial',
      fontSize: 18,
      color: '182B3A',
      margin: 0,
      breakLine: false,
      fit: 'shrink',
    });
    slide.addText(`KRAAK · ${index + 1} / ${pages.length}`, {
      x: 0.6,
      y: 7,
      w: 12.1,
      h: 0.2,
      fontSize: 10,
      color: '526774',
    });
    slide.addNotes(`${page.title}\n\n${page.lines.join('\n')}`);
  }
  for (const image of images) {
    const slide = presentation.addSlide();
    slide.addText(image.title, {
      x: 0.6,
      y: 0.3,
      w: 12.1,
      h: 0.8,
      fontSize: 24,
      fit: 'shrink',
    });
    const scale = Math.min(12.1 / image.width, 5.8 / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    slide.addImage({
      data: image.data,
      x: (13.333 - w) / 2,
      y: 1.2 + (5.8 - h) / 2,
      w,
      h,
    });
    slide.addNotes(image.title);
  }
  await presentation.writeFile({ fileName: destination });
}

function checksum(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function exportDocument(
  document,
  { format, destination, source },
) {
  if (!formats.has(format) || format === 'all') {
    throw new Error(`Format non pris en charge : ${format}`);
  }
  if (format !== 'txt' && document.hasMermaid) {
    throw new Error(
      'Mermaid brut détecté : rendre les diagrammes en images et remplacer les blocs avant un export PDF/PPTX.',
    );
  }
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp.${format}`;
  try {
    const images = format === 'txt' ? [] : await loadImages(document, source);
    const renderers = {
      txt: () => writeFile(temporary, document.text, 'utf8'),
      pdf: () => renderPdf(document, temporary, images),
      pptx: () => renderPptx(document, temporary, images),
    };
    await renderers[format]();
    const artifact = await readFile(temporary);
    await rename(temporary, destination);
    await writeFile(
      `${destination}.json`,
      `${JSON.stringify(
        {
          source: source ? path.relative(process.cwd(), source) : null,
          sourceSha256: document.sourceSha256,
          artifactSha256: checksum(artifact),
          format,
          generatedAt: new Date().toISOString(),
          generator: 'scripts/export-docs.mjs',
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await rm(temporary, { force: true });
  }
}

async function main(args) {
  const options = parseArguments(args);
  const source = path.resolve(options.source);
  if (path.extname(source).toLowerCase() !== '.md') {
    throw new Error('La source doit être un fichier Markdown (.md).');
  }
  const document = createDocument(await readFile(source, 'utf8'));
  const name = path.parse(source).name;
  const output = path.resolve(options.output ?? '.artifacts/docs', name);
  const requestedFormats =
    options.format === 'all' ? ['txt', 'pdf', 'pptx'] : [options.format];
  const destinations = await Promise.all(
    requestedFormats.map(async (format) => {
      const destination = path.join(output, `${name}.${format}`);
      await exportDocument(document, { format, source, destination });
      return destination;
    }),
  );
  for (const destination of destinations) {
    console.info(`[docs:export] ${destination}`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error('[docs:export] Échec de génération :', error);
    process.exitCode = 1;
  }
}
