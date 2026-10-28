import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createDocument } from './model.mjs';
import { renderDiagrams, containsMermaidInteraction } from './mermaid.mjs';
import { chromium } from 'playwright';

test('Given des mots click dans des textes et de vraies directives When les interactions sont détectées Then seules les commandes exécutables sont rejetées', () => {
  for (const definition of [
    'graph TD; A[Click here]-->B[Done]',
    'graph TD; A["; click A \\"example\\""]-->B',
    'graph TD; A[`; click A example`]-->B',
    'graph TD\n%% click A example\nA((Click here))-->B{Done}',
    'graph TD\n%% click A example',
    'graph TD\naccDescr: click here to continue\naccTitle: click here\nA-->B',
  ])
    assert.equal(containsMermaidInteraction(definition), false, definition);
  for (const definition of [
    'graph TD\nclick A "example"',
    'graph TD; click A callback',
    ')\nclick A callback',
  ])
    assert.equal(containsMermaidInteraction(definition), true, definition);
});

test('Given un navigateur simulé When un SVG invalide ou une directive est produit Then le moteur refuse le résultat sans publier de cache valide', async (context) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'kraak-svg-validation-'),
  );
  const previous = globalThis.mermaid;
  let svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect width="10" height="10"/></svg>';
  let aborted = false;
  globalThis.mermaid = {
    initialize: (config) => assert.equal(config.deterministicIds, true),
    render: async () => ({ svg }),
  };
  context.mock.method(chromium, 'launch', async () => ({
    version: () => 'test',
    close: async () => {},
    newPage: async () => ({
      route: async (_, handler) =>
        handler({
          abort: () => {
            aborted = true;
          },
        }),
      setContent: async () => {},
      addScriptTag: async () => {},
      evaluate: async (callback, args) => callback(args),
    }),
  }));
  try {
    const document = createDocument('```mermaid\ngraph TD; A-->B\n```');
    const [asset] = await renderDiagrams(document, directory);
    assert.equal(aborted, true);
    const metadata = path.join(directory, `${asset.renderHash}.json`);
    await writeFile(
      metadata,
      JSON.stringify({ ...asset, svgSha256: 'corrupt' }),
    );
    assert.equal(
      (await renderDiagrams(document, directory))[0].svgSha256,
      asset.svgSha256,
    );
    for (const [index, invalid] of [
      '<svg viewBox="0 0 0 0"/>',
      '<svg viewBox="0 0 20 20"><script/></svg>',
      '<svg viewBox="0 0 20 20"><foreignObject/></svg>',
      '<svg viewBox="0 0 20 20"><a href="https://example.org"/></svg>',
      '<svg viewBox="0 0 20 20"><x></svg>',
    ].entries()) {
      svg = invalid;
      await assert.rejects(
        renderDiagrams(document, path.join(directory, `bad-${index}`)),
        /SVG Mermaid/,
      );
    }
    await assert.rejects(
      renderDiagrams(
        createDocument(
          '```mermaid\ngraph TD\nclick A "https://example.org"\n```',
        ),
        directory,
      ),
      /interdites/,
    );
  } finally {
    if (previous === undefined) delete globalThis.mermaid;
    else globalThis.mermaid = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

test('Given un diagramme français When deux rendus et un cache corrompu sont traités Then les SVG sont identiques et le cache est réparé', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-mermaid-'));
  try {
    const document = createDocument(
      '```mermaid\ngraph TD\naccTitle: Équipe\naccDescr: Formation puis action.\nA[Click here]-->B[Action]\n```',
    );
    const [first] = await renderDiagrams(document, path.join(directory, 'one'));
    const [second] = await renderDiagrams(
      document,
      path.join(directory, 'two'),
    );
    assert.equal(first.svgSha256, second.svgSha256);
    const original = await readFile(first.svgPath);
    assert.match(original.toString(), /xml:space="preserve"/);
    await writeFile(first.svgPath, 'corrompu');
    const [repaired] = await renderDiagrams(
      document,
      path.join(directory, 'one'),
    );
    assert.deepEqual(await readFile(repaired.svgPath), original);
    const cached = JSON.parse(
      await readFile(
        path.join(directory, 'one', `${first.renderHash}.json`),
        'utf8',
      ),
    );
    for (const dimension of ['width', 'height']) {
      await writeFile(
        path.join(directory, 'one', `${first.renderHash}.json`),
        JSON.stringify({ ...cached, [dimension]: first[dimension] + 30 }),
      );
      assert.equal(
        (await renderDiagrams(document, path.join(directory, 'one')))[0][
          dimension
        ],
        first[dimension],
      );
    }
    assert.ok(first.width > 0 && first.height > 0);
    await assert.rejects(
      renderDiagrams(
        createDocument('```mermaid\ninvalid syntax\n```'),
        directory,
      ),
      /Mermaid/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
