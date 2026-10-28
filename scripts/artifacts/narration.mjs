import { inlineText } from './model.mjs';

function spokenInline(tokens, language) {
  return tokens
    .map((token) => {
      if (token.type === 'html') return '';
      if (token.type === 'link' && /^(https?:\/\/|www\.)/i.test(token.text))
        return language === 'en-GB' ? 'link' : 'lien';
      if (token.tokens) return spokenInline(token.tokens, language);
      return inlineText([token]);
    })
    .join('');
}

export function renderNarration(document, options = {}) {
  const language = document.language;
  const render = (token) => {
    if (['space', 'html', 'hr', 'def'].includes(token.type)) return '';
    if (token.type === 'code') {
      const alternative =
        token.narration ?? options.codeAlternatives?.[token.sourceSha256];
      if (!alternative)
        throw new Error(
          'Une description ou alternative de narration est requise pour chaque bloc de code ou Mermaid.',
        );
      return alternative;
    }
    if (token.type === 'list')
      return token.items
        .map((item) => item.tokens.map(render).filter(Boolean).join(' '))
        .map((text) => (/[.!?:;]$/.test(text) ? text : `${text}.`))
        .join('\n\n');
    if (token.type === 'blockquote')
      return token.tokens.map(render).filter(Boolean).join('\n\n');
    if (token.type === 'table') {
      if (!token.rows.length)
        return token.header
          .map((cell) => spokenInline(cell.tokens, language))
          .join('; ');
      return token.rows
        .map((row) =>
          row
            .map(
              (cell, index) =>
                `${spokenInline(token.header[index].tokens, language)}${language === 'en-GB' ? ': ' : ' : '}${spokenInline(cell.tokens, language)}`,
            )
            .join('; '),
        )
        .join('\n\n');
    }
    return spokenInline(token.tokens ?? [token], language);
  };
  return (
    document.tokens
      .map(render)
      .flatMap((text) => text.split(/\n{2,}/))
      .filter(Boolean)
      .map((text) => text.replace(/\s+/gu, ' ').trim())
      .join('\n\n')
      .trimEnd() + '\n'
  );
}

export function chunkNarration(text, maximum = 4000) {
  if (!Number.isInteger(maximum) || maximum < 1)
    throw new Error('Taille de segment invalide.');
  const chunks = [];
  for (const paragraph of text.trimEnd().split('\n\n')) {
    const last = chunks.at(-1);
    if (last && last.length + paragraph.length + 2 <= maximum)
      chunks[chunks.length - 1] += `\n\n${paragraph}`;
    else chunks.push(paragraph);
  }
  return chunks;
}
