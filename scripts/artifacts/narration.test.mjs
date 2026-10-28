import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDocument } from './model.mjs';
import { renderNarration, chunkNarration } from './narration.mjs';

test('Given un nœud texte sans enveloppe When la narration est produite Then le contenu est conservé', () => {
  assert.equal(
    renderNarration({
      language: 'fr-CI',
      tokens: [{ type: 'text', text: 'Texte.' }],
    }),
    'Texte.\n',
  );
});

test('Given une liste sans ponctuation When la narration est produite Then les éléments restent des phrases distinctes', () => {
  assert.equal(
    renderNarration(createDocument('- Formation\n- Conseil')),
    'Formation.\n\nConseil.\n',
  );
});

test('Given des URL et citations bilingues When le texte oral est extrait Then les liens et alternatives restent lisibles', () => {
  for (const language of ['fr-CI', 'en-GB']) {
    const document = createDocument(
      `---\nlang: ${language}\n---\n# Impact\n\n> <span>Texte</span> et https://example.org\n\n\`\`\`js\nconst ready = true;\n\`\`\`\n`,
    );
    const code = document.tokens.find((token) => token.type === 'code');
    const text = renderNarration(document, {
      codeAlternatives: { [code.sourceSha256]: 'Prêt.' },
    });
    assert.doesNotMatch(text, /https:|<span>/);
    assert.match(text, language === 'fr-CI' ? /lien/ : /link/);
    assert.match(text, /Prêt/);
  }
});

test('Given des paragraphes longs When la narration est segmentée Then aucune phrase n’est tronquée et les tailles invalides sont refusées', () => {
  assert.deepEqual(chunkNarration('Long paragraphe.\n\nBref.\n', 4), [
    'Long paragraphe.',
    'Bref.',
  ]);
  assert.deepEqual(chunkNarration('A.\n\nB.\n'), ['A.\n\nB.']);
  for (const size of [0, -1, 1.5, NaN])
    assert.throws(() => chunkNarration('Texte', size), /invalide/);
});
