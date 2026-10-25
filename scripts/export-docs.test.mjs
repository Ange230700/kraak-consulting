import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  createDocument,
  exportDocument,
  paginateSections,
  parseArguments,
} from './export-docs.mjs';

test('Given des options When la commande est analysée Then le format et la source sont explicites', () => {
  assert.deepEqual(
    parseArguments(['--source', 'README.md', '--format', 'txt']),
    {
      source: 'README.md',
      format: 'txt',
    },
  );
  assert.throws(() => parseArguments(['--format', 'mp3']), /source|format/i);
  assert.throws(
    () => parseArguments(['--source', 'README.md', '--oops']),
    /inconnue/,
  );
});

test('Given du Markdown When le transcript est extrait Then les accents, listes et tableaux sont conservés sans balisage', () => {
  const document = createDocument(`---
status: active
---
# Présentation

<!-- privé -->
Bonjour **KRAAK** et [notre équipe](https://example.invalid).

## Services

- Formation
- Conseil

| Offre | Public |
| --- | --- |
| Formation | Équipes |

![Schéma](diagram.png)

\`\`\`js
const result = 1;
\`\`\`
`);
  assert.equal(document.title, 'Présentation');
  assert.match(document.text, /Bonjour KRAAK et notre équipe/);
  assert.match(document.text, /- Formation\n- Conseil/);
  assert.match(document.text, /Offre : Formation ; Public : Équipes/);
  assert.match(document.text, /Illustration : Schéma/);
  assert.match(document.text, /const result = 1;/);
  assert.doesNotMatch(document.text, /status:|privé|\*\*|https:/);
  assert.doesNotMatch(document.html, /<!-- privé -->/);
});

test('Given un document long When les diapositives sont préparées Then aucun texte ne disparaît et les limites sont respectées', () => {
  const text = Array.from({ length: 400 }, (_, index) => `mot${index}`).join(
    ' ',
  );
  const pages = paginateSections([{ title: 'Services', text }]);
  assert.ok(pages.length > 1);
  assert.equal(pages.flatMap((page) => page.lines).join(' '), text);
  assert.ok(pages.every((page) => page.lines.length <= 12));
  assert.ok(
    pages.every((page) => page.lines.every((line) => line.length <= 80)),
  );
});

test('Given du Mermaid brut When un export visuel est demandé Then la génération est refusée explicitement', async () => {
  const document = createDocument(
    '# Schéma\n\n```mermaid\ngraph TD; A-->B\n```',
  );
  await assert.rejects(
    exportDocument(document, { format: 'pdf', destination: 'unused.pdf' }),
    /Mermaid/,
  );
});

test('Given une source Markdown When TXT est exporté Then le fichier et sa provenance sont vérifiables', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-export-'));
  try {
    const source = path.join(directory, 'source.md');
    const destination = path.join(directory, 'source.txt');
    await writeFile(source, '# Mission\n\nDévelopper les compétences.\n');
    const document = createDocument(await readFile(source, 'utf8'));
    await exportDocument(document, { format: 'txt', source, destination });
    assert.equal(await readFile(destination, 'utf8'), document.text);
    const metadata = JSON.parse(await readFile(`${destination}.json`, 'utf8'));
    assert.equal(metadata.format, 'txt');
    assert.match(metadata.sourceSha256, /^[a-f0-9]{64}$/);
    assert.match(metadata.artifactSha256, /^[a-f0-9]{64}$/);
    assert.equal(
      metadata.artifactSha256,
      createHash('sha256').update(document.text).digest('hex'),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Given un document When PPTX est généré Then un fichier Office non vide est produit sans navigateur', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-pptx-'));
  try {
    const destination = path.join(directory, 'mission.pptx');
    await exportDocument(
      createDocument('# Mission\n\nDévelopper les compétences.'),
      {
        format: 'pptx',
        destination,
      },
    );
    const artifact = await readFile(destination);
    assert.equal(artifact.subarray(0, 2).toString(), 'PK');
    assert.ok(artifact.length > 1000);
    assert.match(artifact.toString(), /ppt\/slides\/slide1.xml/);
    assert.match(artifact.toString(), /ppt\/notesSlides\/notesSlide1.xml/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Given une illustration distante When un export visuel est demandé Then aucun téléchargement ne peut se produire', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-image-'));
  try {
    await assert.rejects(
      exportDocument(
        createDocument(
          '# Mission\n\n![Secret](https://example.invalid/image.png)',
        ),
        {
          source: path.join(directory, 'source.md'),
          format: 'pptx',
          destination: path.join(directory, 'mission.pptx'),
        },
      ),
      /non locale/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Given des entités HTML When le transcript est extrait Then elles sont décodées hors du code', () => {
  const document = createDocument('# Caf&#233;\n\nA &amp; B, `&amp;`.');
  assert.match(document.text, /Café/);
  assert.match(document.text, /A & B, &amp;/);
});

test('Given des titres consécutifs When les sections sont préparées Then aucun titre intermédiaire ne disparaît', () => {
  const document = createDocument(
    '# Mission\n\n## Services\n\n### Formation\n\nApprendre.',
  );
  assert.deepEqual(
    document.sections.map((section) => section.title),
    ['Mission', 'Services', 'Formation'],
  );
});
