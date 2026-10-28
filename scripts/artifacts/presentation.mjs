import {
  blockText,
  inlineText,
  paginateSections,
  containsMermaidBlock,
} from './model.mjs';
import { sha256, stableJson } from './identity.mjs';

export function createPresentation(document, images = []) {
  const slides = [];
  const addText = (title, text) =>
    slides.push(
      ...paginateSections([{ title, text }]).map((page) => ({
        kind: 'text',
        title:
          page.title +
          (page.continuation
            ? document.language === 'en-GB'
              ? ' (continued)'
              : ' (suite)'
            : ''),
        text: page.lines.join('\n'),
      })),
    );
  addText(document.title, 'KRAAK — Export documentaire');
  let title = document.title;
  let text = '';
  let pendingHeading = false;
  const flush = (preserveHeading = false) => {
    if (text || (preserveHeading && pendingHeading)) {
      addText(title, text);
      pendingHeading = false;
    }
    text = '';
  };
  const visit = (tokens) => {
    for (const token of tokens) {
      if (token.type === 'heading') {
        flush(true);
        title = inlineText(token.tokens);
        pendingHeading = true;
      } else if (token.type === 'table') {
        flush();
        pendingHeading = false;
        const header = token.header.map((cell) => inlineText(cell.tokens));
        const rows = token.rows.map((row) =>
          row.map((cell) => inlineText(cell.tokens)),
        );
        if (
          header.length > 6 ||
          [header, ...rows].some((row) => row.some((cell) => cell.length > 120))
        ) {
          addText(title, blockText(token));
        } else {
          for (let index = 0; index < Math.max(rows.length, 1); index += 5)
            slides.push({
              kind: 'table',
              title,
              rows: [header, ...rows.slice(index, index + 5)],
            });
        }
      } else if (token.diagramId) {
        flush();
        pendingHeading = false;
        const image = images.find((entry) => entry.id === token.diagramId);
        if (!image)
          throw new Error(`Ressource Mermaid manquante : ${token.diagramId}`);
        slides.push({
          kind: 'image',
          title: image.title,
          imageIndex: images.indexOf(image),
          text: image.description,
        });
      } else if (token.type === 'blockquote') {
        visit(token.tokens);
      } else if (token.type === 'list' && containsMermaidBlock([token])) {
        for (const item of token.items) visit(item.tokens);
      } else {
        const value = blockText(token);
        if (value) text += `${text ? '\n\n' : ''}${value}`;
      }
    }
  };
  visit(document.tokens);
  flush(true);
  images.forEach((image, index) => {
    if (!image.id)
      slides.push({
        kind: 'image',
        title: image.title,
        text: image.title,
        imageIndex: index,
      });
  });
  for (const [index, slide] of slides.entries()) {
    slide.id = `slide-${index + 1}`;
    slide.notes = `${slide.title}\n\n${slide.kind === 'table' ? slide.rows.map((row) => row.join(' ; ')).join('\n') : (slide.text ?? '')}\n\nSource SHA-256 : ${document.sourceSha256}`;
  }
  const spec = {
    version: 1,
    language: document.language,
    sourceSha256: document.sourceSha256,
    width: 13.333333,
    height: 7.5,
    slides,
  };
  return { ...spec, sha256: sha256(stableJson(spec)) };
}
