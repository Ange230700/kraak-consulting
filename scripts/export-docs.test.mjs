import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

import {
  createDocument,
  exportDocument,
  paginateSections,
  parseArguments,
} from './export-docs.mjs';

const execute = promisify(execFile);

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
  for (const args of [
    ['--source'],
    ['--source', '--format'],
    ['--source', 'README.md', '--source', 'README.md'],
  ]) {
    assert.throws(() => parseArguments(args), /manquante|répétée/);
  }
});

test('Given des blocs Markdown variés When le transcript est extrait Then les variantes restent lisibles', () => {
  const document =
    createDocument(`Texte avant titre avec <span>HTML</span> et un saut  
de ligne.

> Citation
>
> Suite

3. Troisième
4. Quatrième

- [x] Fait
- [ ] À faire

| En-tête |
| --- |

\`\`\`
Sans langage
\`\`\`

![](image.png)
`);
  assert.equal(document.title, 'Document KRAAK');
  assert.equal(document.sections[0].title, 'Document KRAAK');
  assert.match(
    document.text,
    /Texte avant titre avec HTML et un saut\nde ligne/,
  );
  assert.match(document.text, /Citation\n\nSuite/);
  assert.match(document.text, /3\. Troisième\n4\. Quatrième/);
  assert.match(document.text, /- \[x\] Fait\n- \[ \] À faire/);
  assert.match(document.text, /En-tête/);
  assert.match(document.text, /Code :\nSans langage/);
  assert.deepEqual(document.images, [
    { href: 'image.png', title: 'Illustration' },
  ]);
});

test('Given des séparateurs sans métadonnées When le document est extrait Then le texte reste intact', () => {
  assert.match(createDocument('---\nSans fermeture').text, /Sans fermeture/);
  assert.match(createDocument('---\n\n---\nContenu').text, /Contenu/);
  assert.equal(createDocument('').text, '\n');
});

test('Given un mot très long et des lignes vides When les sections sont paginées Then le texte est conservé sans débordement', () => {
  const pages = paginateSections([
    { title: 'Mission', text: `${'a'.repeat(170)}\n\nFin` },
  ]);
  assert.deepEqual(pages[0].lines, [
    'a'.repeat(80),
    'a'.repeat(80),
    'a'.repeat(10),
    '',
    'Fin',
  ]);
});

test('Given un format invalide When un export est demandé Then aucun artefact n’est créé', async () => {
  for (const format of ['mp3', 'all']) {
    await assert.rejects(
      exportDocument(createDocument('# Mission'), {
        format,
        destination: 'unused',
      }),
      /non pris en charge/,
    );
  }
});

test('Given une illustration sans source ou hors dépôt When un export est demandé Then il échoue sans fichier temporaire restant', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-outside-'));
  try {
    const image = path.join(directory, 'image.png');
    await writeFile(image, 'hors dépôt');
    const document = createDocument('![Illustration](image.png)');
    const destination = path.join(directory, 'export.pdf');
    await assert.rejects(
      exportDocument(document, { format: 'pdf', destination }),
      /chemin source/,
    );
    await assert.rejects(
      exportDocument(document, {
        format: 'pdf',
        destination,
        source: path.join(directory, 'source.md'),
      }),
      /hors du dépôt/,
    );
    assert.deepEqual(await readdir(directory), ['image.png']);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Given la commande TXT When elle est exécutée Then les sorties explicite et par défaut ainsi que les erreurs sont observables', async () => {
  const root = path.resolve('.artifacts');
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, 'export-cli-'));
  const name = path.basename(directory);
  const source = path.join(directory, `${name}.md`);
  const defaultOutput = path.join(root, 'docs', name);
  try {
    await writeFile(source, '# Mission\n\nFormation.');
    for (const output of [[], ['--output', directory]]) {
      const { stdout } = await execute(process.execPath, [
        'scripts/export-docs.mjs',
        '--source',
        source,
        '--format',
        'txt',
        ...output,
      ]);
      assert.match(stdout, /\[docs:export\]/);
      const destination = output.length
        ? path.join(directory, name, `${name}.txt`)
        : path.join(defaultOutput, `${name}.txt`);
      assert.match(await readFile(destination, 'utf8'), /Formation/);
    }
    await assert.rejects(
      execute(process.execPath, [
        'scripts/export-docs.mjs',
        '--source',
        'package.json',
        '--format',
        'txt',
      ]),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /Échec de génération.*Markdown/s);
        return true;
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(defaultOutput, { recursive: true, force: true });
  }
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

test('Given des blocs Mermaid imbriqués When le document est analysé sans visiteur asynchrone Then seuls les blocs exécutables sont signalés', () => {
  for (const source of [
    '> ```mermaid\n> graph TD; A-->B\n> ```',
    '- Schéma\n\n  ```mermaid\n  graph TD; A-->B\n  ```',
  ]) {
    assert.equal(createDocument(source).hasMermaid, true);
  }
  for (const source of [
    '',
    '`mermaid`',
    '```\nmermaid\n```',
    '> Texte sans diagramme',
    '- Texte sans diagramme',
  ]) {
    assert.equal(createDocument(source).hasMermaid, false);
  }
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

test('Given des séparateurs Markdown en tête When le document est extrait Then le contenu entre séparateurs reste dans tous les rendus', () => {
  const document = createDocument(
    '---\n# Mission\n\nDévelopper les compétences.\n\n---\n\n## Services\n\nFormation.',
  );
  assert.equal(document.title, 'Mission');
  assert.match(document.text, /Développer les compétences/);
  assert.match(document.html, /Développer les compétences/);
  assert.match(document.sections[0].text, /Développer les compétences/);
});

test('Given des métadonnées plates When le document est extrait Then seules les métadonnées reconnues sont retirées', () => {
  const document = createDocument(
    '\uFEFF---\r\n# Métadonnées\r\nstatus: active\r\nowner: platform\r\n\r\nsource_of_truth: true\r\n---\r\n# Mission\r\n\r\nFormation.',
  );
  assert.equal(document.title, 'Mission');
  assert.doesNotMatch(
    document.text,
    /status:|owner:|source_of_truth:|Métadonnées/,
  );
  const mixed = createDocument(
    '---\nstatus: active\n\nDu contenu ordinaire.\n---\n# Mission',
  );
  assert.match(mixed.text, /Du contenu ordinaire/);
});

test('Given un sommaire et des titres répétés When le HTML du PDF est généré Then ses ancres suivent la normalisation du sommaire', () => {
  const document = createDocument(
    '# Document\n\n[Aller aux services](#services-formation)\n\n## **Services** : formation\n\n### Équipe & mission\n\n## Services : formation\n\n## Services : formation-1\n\n## Services : formation\n',
  );
  assert.match(document.html, /href="#services-formation"/);
  assert.match(document.html, /<h2 id="services-formation">/);
  assert.match(document.html, /<h3 id="equipe-mission">/);
  assert.match(document.html, /<h2 id="services-formation-1">/);
  assert.match(document.html, /<h2 id="services-formation-1-1">/);
  assert.match(document.html, /<h2 id="services-formation-2">/);
});
