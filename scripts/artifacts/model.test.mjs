import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDocument } from '../export-docs.mjs';
import { renderNarration, chunkNarration } from './narration.mjs';
import { stableJson, sha256 } from './identity.mjs';
import { semanticBlocksFromTokens } from './model.mjs';

test('Given une langue dans un exemple du corps When les métadonnées sont lues Then seule la langue du frontmatter est utilisée', () => {
  for (const language of ['en-GB', 'de-DE'])
    assert.equal(
      createDocument(
        `---\nstatus: active\n---\n# Mission\n\n\`\`\`yaml\nlang: ${language}\n\`\`\``,
      ).language,
      'fr-CI',
    );
});

test('Given un texte AST élémentaire et une description multiligne When le modèle est normalisé Then leur contenu reste explicite', () => {
  assert.deepEqual(
    semanticBlocksFromTokens([{ type: 'text', text: 'Texte' }]),
    ['Texte'],
  );
  const document = createDocument(
    '```mermaid\ngraph TD\naccDescr {\nUne description.\n}\nA-->B\n```',
  );
  assert.equal(document.diagrams[0].description, 'Une description.');
});

test('Given des métadonnées et un diagramme When le modèle est extrait Then les identités et la langue sont stables', () => {
  const source =
    '---\nlang: en-GB\n---\n# Impact\n\n```mermaid\naccTitle: Path\naccDescr: From training to action.\ngraph TD; A-->B\n```';
  const document = createDocument(source);
  assert.equal(document.language, 'en-GB');
  assert.equal(document.diagrams.length, 1);
  assert.equal(document.diagrams[0].description, 'From training to action.');
  assert.equal(
    document.diagrams[0].sourceSha256,
    sha256(document.diagrams[0].definition),
  );
  assert.equal(stableJson(document), stableJson(createDocument(source)));
  assert.throws(() => createDocument('---\nlang: xx\n---\n# Test'), /langue/i);
});

test('Given du Markdown français When la narration est produite Then le texte est stable sans syntaxe ni URL', () => {
  const source =
    '# Équipe\r\n\r\nBonjour **KRAAK**, [nos services](https://example.org).\r\n\r\n- Formation\r\n- Conseil\r\n\r\n| Offre | Public |\r\n| --- | --- |\r\n| Formation | Équipes |\r\n';
  const narration = renderNarration(createDocument(source));
  assert.match(narration, /Bonjour KRAAK, nos services/);
  assert.match(narration, /Offre : Formation/);
  assert.doesNotMatch(narration, /https:|\*\*|\r|^- /m);
  assert.equal(narration, renderNarration(createDocument(source)));
  assert.equal(chunkNarration(narration, 60).join('\n\n') + '\n', narration);
});

test('Given un code ou Mermaid sans alternative When la narration est demandée Then elle refuse une omission silencieuse', () => {
  assert.throws(
    () => renderNarration(createDocument('```mermaid\ngraph TD; A-->B\n```')),
    /description|alternative/i,
  );
  assert.throws(
    () => renderNarration(createDocument('```js\nconst a = 1;\n```')),
    /alternative/i,
  );
  const document = createDocument(
    '```mermaid\naccDescr: Formation puis action.\ngraph TD; A-->B\n```',
  );
  assert.equal(renderNarration(document), 'Formation puis action.\n');
});
