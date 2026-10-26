import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildMarkdownTocUpdates,
  renderMarkdownWithToc,
  runCli,
} from './generate-markdown-tocs.mjs';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'scripts', 'generate-markdown-tocs.mjs');

function writeMarkdown(root, file, content) {
  const target = path.join(root, file);

  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(
    target,
    content.trimStart().replace(/\n/g, '\n') + '\n',
    'utf8',
  );
}

function runGit(root, args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function runScript(root, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
  });
}

function createFixtureRepository() {
  mkdirSync(path.join(repoRoot, '.reports'), { recursive: true });
  const root = mkdtempSync(
    path.join(repoRoot, '.reports', 'markdown-tocs-fixture-'),
  );

  runGit(root, ['init']);
  writeMarkdown(
    root,
    '.gitignore',
    `
ignored.md
`,
  );
  writeMarkdown(
    root,
    'docs/tracked.md',
    `
# Guide

## Même section

Texte.

## [TASK][DOCS] Section balisée

Texte.

## Même section

Texte.
`,
  );
  writeMarkdown(
    root,
    'docs/untracked.md',
    `
---
status: active
---

# Notice

## Usage
`,
  );
  writeMarkdown(
    root,
    'ignored.md',
    `
# Ignoré

## Section ignorée
`,
  );
  runGit(root, ['add', '.gitignore', 'docs/tracked.md']);

  return root;
}

test('Given des Markdown suivis et non ignorés, When les sommaires sont écrits, Then les fichiers ignorés restent intacts', () => {
  const root = createFixtureRepository();

  try {
    const writeResult = runScript(root, ['--write']);

    assert.equal(
      writeResult.status,
      0,
      writeResult.stderr || writeResult.stdout,
    );

    const tracked = readFileSync(path.join(root, 'docs/tracked.md'), 'utf8');
    const untracked = readFileSync(
      path.join(root, 'docs/untracked.md'),
      'utf8',
    );
    const ignored = readFileSync(path.join(root, 'ignored.md'), 'utf8');

    assert.match(tracked, /## Table des matières/);
    assert.match(tracked, /- \[Guide\]\(#guide\)/);
    assert.match(tracked, / {2}- \[Même section\]\(#meme-section\)/);
    assert.match(
      tracked,
      / {2}- \[\[TASK\]\[DOCS\] Section balisée\]\(#taskdocs-section-balisee\)/,
    );
    assert.match(tracked, / {2}- \[Même section\]\(#meme-section-1\)/);
    assert.match(untracked, /## Table des matières/);
    assert.doesNotMatch(ignored, /## Table des matières/);

    const checkResult = runScript(root, ['--check']);

    assert.equal(
      checkResult.status,
      0,
      checkResult.stderr || checkResult.stdout,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Given un sommaire obsolète, When le contrôle est exécuté, Then il échoue sans réécrire le fichier', () => {
  const root = createFixtureRepository();

  try {
    const writeResult = runScript(root, ['--write']);

    assert.equal(
      writeResult.status,
      0,
      writeResult.stderr || writeResult.stdout,
    );

    writeMarkdown(
      root,
      'docs/tracked.md',
      `
# Guide

## Nouvelle section
`,
    );

    const checkResult = runScript(root, ['--check']);
    const tracked = readFileSync(path.join(root, 'docs/tracked.md'), 'utf8');

    assert.equal(checkResult.status, 1);
    assert.match(
      checkResult.stderr,
      /docs\/tracked\.md is missing or has a stale table of contents/,
    );
    assert.doesNotMatch(tracked, /## Table des matières/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Given des caractères Markdown et des titres répétés, When le sommaire est rendu, Then les libellés et ancres sont normalisés', () => {
  const input =
    '# Guide\n\n## <em>Été</em> ![Image](image.png) [Lien](url) **gras** __fort__ *italique* _simple_ `code` ~barré~ \\!\n\n## Même\n## Même\n## Même\n## ***\n';
  const output = renderMarkdownWithToc(input);
  assert.match(
    output,
    /\[Été Image Lien gras fort italique simple code barré !\]/,
  );
  assert.match(output, /\[Même\]\(#meme\)/);
  assert.match(output, /\[Même\]\(#meme-1\)/);
  assert.match(output, /\[Même\]\(#meme-2\)/);
  assert.match(output, /\[\*\*\*\]\(#section\)/);
  assert.equal(renderMarkdownWithToc(output), output);
});

test('Given de longs titres malformés, When le sommaire est rendu, Then chaque analyse termine en moins d’une seconde', () => {
  for (const marker of ['<', '[', '#', '[a](']) {
    const input = `# Guide\n\n## ${marker.repeat(30_000)}\n`;
    const started = performance.now();
    const output = renderMarkdownWithToc(input);
    assert.ok(
      performance.now() - started < 1_000,
      `Analyse trop lente pour le caractère ${marker}`,
    );
    assert.ok(output.includes('## Table des matières'));
    assert.ok(output.endsWith(input.slice(input.indexOf('## '))));
  }
});

test('Given des liens incomplets et des titres fermés, When le sommaire est rendu, Then les contenus littéraux et les ancres sont conservés', () => {
  const output = renderMarkdownWithToc(
    '# Guide\n\n## Texte ###   \n## [Lien](url) ![Image](image) []() ![](image)\n## <incomplet\n## [sans fin\n## [lien] sans cible\n## [cible](sans fin\n## [vide]()\n## ###\n',
  );
  assert.ok(output.includes('[Texte](#texte)'));
  assert.ok(output.includes('[Lien Image []()](#lienurl-imageimage-image)'));
  assert.ok(output.includes('[<incomplet](#incomplet)'));
  assert.ok(output.includes('[[sans fin](#sans-fin)'));
  assert.ok(output.includes('[[lien] sans cible](#lien-sans-cible)'));
  assert.ok(output.includes('[[cible](sans fin](#ciblesans-fin)'));
  assert.ok(output.includes('[[vide]()](#vide)'));
  assert.ok(output.includes('[#](#section)'));
  assert.equal(renderMarkdownWithToc(output), output);
});

test('Given une image dans un lien, When le titre est nettoyé, Then seul le libellé accessible apparaît dans le sommaire', () => {
  const output = renderMarkdownWithToc(
    '# Guide\n\n## [![Illustration](image.png)](page) et ![Sans cible]()\n',
  );
  assert.ok(
    output.includes(
      '[Illustration et ![Sans cible]()](#illustrationimagepngpage-et-sans-cible)',
    ),
  );
  assert.equal(renderMarkdownWithToc(output), output);
});

test('Given des blocs de code imbriqués, When les titres sont extraits, Then seuls les titres hors blocs apparaissent', () => {
  const input =
    '# Visible\n\n````md\n## Caché\n```\n~~~\n## Toujours caché\n````\n\n~~~md\n## Autre caché\n~~~\n\n## Fin\n';
  const output = renderMarkdownWithToc(input);
  assert.match(output, /\[Visible\]\(#visible\)/);
  assert.match(output, /\[Fin\]\(#fin\)/);
  assert.doesNotMatch(output, /\[Caché\]|\[Toujours caché\]|\[Autre caché\]/);
});

test('Given un ancien sommaire traduit, When il est remplacé, Then son contenu disparaît sans supprimer la section suivante', () => {
  for (const title of ['Table of contents', 'TOC', 'Table des matières']) {
    const input = `# Guide\n\n## ${title}\n\n- [Ancien](#ancien)\n  * [Sous-section](#sous-section)\n\n## Nouveau\nTexte`;
    const output = renderMarkdownWithToc(input);
    assert.equal((output.match(/## Table des matières/g) ?? []).length, 1);
    assert.doesNotMatch(output, /Ancien|Sous-section/);
    assert.match(output, /## Nouveau\nTexte$/);
  }
  assert.doesNotMatch(
    renderMarkdownWithToc('# Guide\n\n## TOC\n- [Ancien](#ancien)\n'),
    /Ancien/,
  );
});

test('Given un BOM et des fins de ligne Windows, When le sommaire est inséré, Then l’encodage et la dernière ligne sont préservés', () => {
  for (const suffix of ['', '\r\n']) {
    const output = renderMarkdownWithToc(
      `\uFEFF# Guide\r\n\r\n## Étape${suffix}`,
    );
    assert.ok(output.startsWith('\uFEFF# Guide\r\n'));
    assert.equal(output.endsWith('\r\n'), suffix !== '');
    assert.ok(!/(?<!\r)\n/.test(output));
  }
});

test('Given des documents sans titre principal, When le sommaire est inséré, Then les métadonnées et les sections restent ordonnées', () => {
  for (const input of [
    '---\nstatus: active\n---\n\n## Section\n',
    '---\nstatus: active\n## Section\n',
    '\n\n## Section',
    '```\n# Caché\n```\n## Section',
  ]) {
    const output = renderMarkdownWithToc(input);
    assert.match(output, /- \[Section\]\(#section\)/);
    assert.ok(
      output.indexOf('## Table des matières') < output.indexOf('## Section'),
    );
  }
  const generated = renderMarkdownWithToc(
    '# Guide\n\n<!-- Generated by fixture -->\n\n\n## Section\n',
  );
  assert.ok(
    generated.indexOf('<!-- Generated') <
      generated.indexOf('## Table des matières'),
  );
  assert.match(renderMarkdownWithToc('# Guide'), /- \[Guide\]\(#guide\)$/);
  assert.match(
    renderMarkdownWithToc('# Guide\n<!-- Generated by fixture -->'),
    /- \[Guide\]\(#guide\)$/,
  );
});

test('Given un document sans titre utilisable, When le sommaire est calculé, Then le contenu reste inchangé', () => {
  for (const input of ['', 'Texte seul\n', '## TOC\n', '```\n# Code\n```\n']) {
    assert.equal(renderMarkdownWithToc(input), input);
  }
});

test('Given des fichiers suivis supprimés ou devenus répertoires, When Git est inspecté, Then aucun remplacement n’est proposé', (t) => {
  const root = createFixtureRepository();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const tracked = path.join(root, 'docs', 'tracked.md');
  rmSync(tracked);
  let result = buildMarkdownTocUpdates(root);
  assert.ok(result.files.includes('docs/tracked.md'));
  assert.ok(
    !result.updates.some((update) => update.relativeFile === 'docs/tracked.md'),
  );
  mkdirSync(tracked);
  result = buildMarkdownTocUpdates(root);
  assert.ok(
    !result.updates.some((update) => update.relativeFile === 'docs/tracked.md'),
  );
});

test('Given des arguments CLI incorrects, When ils sont lus, Then l’aide et les erreurs utilisent les codes publics', (t) => {
  const logs = [];
  const errors = [];
  t.mock.method(console, 'log', (message) => logs.push(message));
  t.mock.method(console, 'error', (message) => errors.push(message));
  for (const args of [['--help'], ['-h'], ['--help', '--inconnue']]) {
    assert.equal(runCli(args), 0);
  }
  for (const args of [[], ['--write', '--check'], ['--inconnue']]) {
    assert.equal(runCli(args), 2);
  }
  assert.ok(logs.every((message) => message.startsWith('Usage:')));
  assert.ok(errors.includes('Unknown option: --inconnue'));
  assert.ok(errors.includes('Choose exactly one mode: --check or --write.'));
});

test('Given un dossier sans Git, When la CLI vérifie les sommaires, Then elle explique l’échec d’inspection', (t) => {
  const errors = [];
  t.mock.method(console, 'error', (message) => errors.push(message));
  assert.equal(
    runCli(['--check'], path.join(repoRoot, '.reports', 'missing-git-root')),
    2,
  );
  assert.match(errors[0], /Unable to inspect Markdown files through Git:/);
});

test('Given un dépôt courant isolé, When les paramètres sont omis, Then les API et la CLI inspectent ce dépôt', (t) => {
  const root = createFixtureRepository();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const previous = process.cwd();
  const previousArgs = process.argv;
  t.mock.method(console, 'log', () => {});
  try {
    process.chdir(root);
    process.argv = [process.execPath, scriptPath, '--write'];
    assert.ok(buildMarkdownTocUpdates().updates.length > 0);
    assert.equal(runCli(), 0);
    assert.equal(runCli(['--check']), 0);
  } finally {
    process.chdir(previous);
    process.argv = previousArgs;
  }
});
