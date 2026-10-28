import { Marked } from 'marked';
import { decodeHTML } from 'entities';
import { createHeadingSlug } from '../generate-markdown-tocs.mjs';
import { sha256 } from './identity.mjs';
const markdown = new Marked({ gfm: true });

export function inlineText(tokens = []) {
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

export function blockText(token) {
  switch (token.type) {
    case 'space':
    case 'html':
    case 'hr':
    case 'def':
      return '';
    case 'code': {
      const label = token.lang ? `Code (${token.lang.split(/\s/)[0]})` : 'Code';
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

export function semanticBlocksFromTokens(tokens) {
  return tokens
    .flatMap((token) => {
      if (token.type === 'list')
        return token.items.flatMap((item) =>
          semanticBlocksFromTokens(item.tokens),
        );
      if (token.type === 'blockquote')
        return semanticBlocksFromTokens(token.tokens);
      if (token.type === 'code') return token.diagramId ? [] : [token.text];
      if (token.type === 'table')
        return [token.header, ...token.rows].map((row) =>
          row.map((cell) => inlineText(cell.tokens)).join(' '),
        );
      if (['heading', 'paragraph', 'text'].includes(token.type))
        return [
          inlineText(token.tokens ?? [token]).replaceAll('Illustration : ', ''),
        ];
      return [];
    })
    .filter(Boolean);
}

export function createDocument(sourceText) {
  const tokens = markdown.lexer(stripFrontmatter(sourceText));
  const body = stripFrontmatter(sourceText);
  const frontmatter = sourceText
    .replace(/^\uFEFF/, '')
    .replaceAll('\r\n', '\n');
  const language =
    body !== frontmatter
      ? (frontmatter.match(
          /^(?:lang|language):\s*['"]?(fr-CI|en-GB|[^\s'"]+)['"]?\s*$/m,
        )?.[1] ?? 'fr-CI')
      : 'fr-CI';
  if (!['fr-CI', 'en-GB'].includes(language))
    throw new Error(`Langue non prise en charge : ${language}`);
  const diagrams = [];
  const tables = [];
  const links = [];
  const headings = [];
  markdown.walkTokens(tokens, (token) => {
    if (token.type === 'code') {
      token.sourceSha256 = sha256(
        token.text.replaceAll('\r\n', '\n').trimEnd() + '\n',
      );
      token.narration = token.lang?.match(/\bnarration:\s*(.+)$/)?.[1];
      if (token.lang?.split(/\s/)[0] === 'mermaid') {
        const definition = token.text.replaceAll('\r\n', '\n').trimEnd() + '\n';
        const description =
          definition.match(/^\s*accDescr:\s*(.+)$/m)?.[1] ??
          definition.match(/accDescr\s*\{([^}]+)\}/s)?.[1]?.trim();
        token.narration = description;
        token.diagramId = `diagram-${diagrams.length + 1}-${token.sourceSha256.slice(0, 12)}`;
        diagrams.push({
          id: token.diagramId,
          definition,
          description: description ?? '',
          title:
            definition.match(/^\s*accTitle:\s*(.+)$/m)?.[1] ??
            description ??
            'Diagramme',
          sourceSha256: token.sourceSha256,
        });
      }
    }
    if (token.type === 'heading')
      headings.push({ depth: token.depth, text: inlineText(token.tokens) });
    if (token.type === 'link') links.push(token.href);
    if (token.type === 'table') {
      const rows = [token.header, ...token.rows].map((row) =>
        row.map((cell) => inlineText(cell.tokens)),
      );
      tables.push(rows);
    }
  });
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
      code(token) {
        if (token.diagramId)
          return `<figure data-export-diagram="${token.diagramId}"></figure>`;
        return `<pre><code>${escapeHtml(token.text)}</code></pre>`;
      },
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
    modelVersion: 1,
    language,
    tokens,
    diagrams,
    tables,
    semanticBlocks: semanticBlocksFromTokens(tokens),
    links,
    headings,
    title,
    text,
    html: renderer.parser(tokens),
    images,
    sections: createSections(tokens, title),
    hasMermaid,
    sourceSha256: sha256(sourceText),
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

export function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;');
}
