import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDocument } from './model.mjs';
import { createPresentation } from './presentation.mjs';

test('Given des sections consécutives et du texte long When le deck est synthétisé Then titres et contenu restent ordonnés sans slides intermédiaires inutiles', () => {
  const document = createDocument(
    '# Mission\n\n## Services\n\n> Formation.\n\n## Suite\n\n' +
      'Autonomie. '.repeat(300),
  );
  const spec = createPresentation(document);
  assert.equal(
    spec.slides.filter((slide) => slide.title === 'Services').length,
    1,
  );
  assert.ok(spec.slides.some((slide) => slide.title.includes('(suite)')));
  assert.ok(
    spec.slides.every((slide) => slide.notes.includes(document.sourceSha256)),
  );
  assert.equal(spec.sha256, createPresentation(document).sha256);
  const english = createPresentation(
    createDocument(
      '---\nlang: en-GB\n---\n# Training\n\n' + 'Skills. '.repeat(300),
    ),
  );
  assert.ok(
    english.slides.some((slide) => slide.title.includes('(continued)')),
  );
});

test('Given des tableaux complexes When la spécification est préparée Then le contenu reste éditable et aucun tableau vide ne disparaît', () => {
  for (const source of [
    '| A |\n| --- |',
    '| A |\n| --- |\n| ' + 'x'.repeat(121) + ' |',
    '| A | B | C | D | E | F | G |\n| --- | --- | --- | --- | --- | --- | --- |\n| a | b | c | d | e | f | g |',
  ]) {
    const spec = createPresentation(createDocument(source));
    assert.ok(spec.slides.length > 1);
    assert.ok(
      spec.slides.some(
        (slide) => slide.kind === 'table' || slide.text.includes('A'),
      ),
    );
  }
});

test('Given du Mermaid imbriqué When les assets sont résolus Then la figure apparaît dans le deck et une ressource manquante échoue', () => {
  const document = createDocument(
    '- Étape\n  - Sous-étape\n\n    ```mermaid\n    graph TD; A-->B\n    ```',
  );
  assert.throws(() => createPresentation(document), /manquante/);
  const spec = createPresentation(document, document.diagrams);
  assert.ok(spec.slides.some((slide) => slide.kind === 'image'));
  const minimal = createPresentation(document, [
    { id: document.diagrams[0].id, title: 'Diagramme' },
  ]);
  assert.ok(minimal.slides.at(-1).notes.includes('Source SHA-256'));
});
