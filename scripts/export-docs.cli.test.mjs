import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { main, parseArguments } from './export-docs.mjs';

test('Given les options de planification et de narration When la CLI les analyse Then les valeurs incohérentes échouent clairement', () => {
  assert.equal(parseArguments(['--help']).help, true);
  assert.equal(
    parseArguments(['--source', 'test.md', '--format', 'all', '--dry-run'])
      .operation,
    'plan',
  );
  for (const tail of [
    ['--operation', 'invalid'],
    ['--chunk-size', '0'],
    ['--chunk-size', '1.5'],
    ['--chunk-size', '12'],
  ])
    assert.throws(() =>
      parseArguments(['--source', 'test.md', '--format', 'txt', ...tail]),
    );
});

test('Given une source avec espaces When plan, génération, segmentation, provenance et vérification sont exécutés Then les preuves correspondent au fichier canonique', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kraak-cli-'));
  try {
    const source = path.join(root, 'source space.md');
    const output = path.join(root, 'output');
    await writeFile(
      source,
      '# Mission\n\nFormation.\n\nAccompagnement adapté.',
    );
    const args = ['--source', source, '--format', 'tts', '--output', output];
    await main(['--help']);
    await main([...args, '--dry-run']);
    assert.deepEqual(await readdir(root), ['source space.md']);
    await main([...args, '--chunk-size', '10']);
    await main([...args, '--operation', 'verify']);
    await main([...args, '--operation', 'provenance']);
    const manifest = JSON.parse(
      await readFile(
        path.join(output, 'source space', 'narration', 'manifest.json'),
        'utf8',
      ),
    );
    assert.equal(manifest.count, 3);
    assert.equal(manifest.chunks.length, 3);
    assert.ok(manifest.oversizedParagraphs > 0);
    const chunkFile = path.join(output, 'source space', 'narration', '001.txt');
    await writeFile(chunkFile, 'corrompu');
    await assert.rejects(main([...args, '--operation', 'verify']), /Segment/);
    const sidecar = path.join(
      output,
      'source space',
      'source space.tts.txt.json',
    );
    const altered = JSON.parse(await readFile(sidecar, 'utf8'));
    altered.chunking.chunks = [];
    await writeFile(sidecar, JSON.stringify(altered));
    await assert.rejects(main([...args, '--operation', 'verify']), /Segments/);
    await main([...args, '--chunk-size', '1000']);
    assert.deepEqual((await readdir(path.dirname(chunkFile))).sort(), [
      '001.txt',
      'manifest.json',
    ]);
    const nested = path.join(output, 'source space', 'source space.md');
    await writeFile(nested, '# Source');
    await assert.rejects(
      main(['--source', nested, '--format', 'txt', '--output', output]),
      /canonique/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Given les formats documentaires When la CLI pilote une QA simulée et une spécification altérée Then les contrôles précèdent le rendu visuel', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kraak-cli-visual-'));
  try {
    const source = path.join(root, 'source.md');
    const output = path.join(root, 'output');
    await writeFile(source, '# Mission\n\nFormation.');
    const args = ['--source', source, '--format', 'all', '--output', output];
    await main(args);
    await main([...args, '--operation', 'verify']);
    const formats = [];
    await main([...args, '--operation', 'visual-qa'], {
      visualRenderer: async (options) => {
        formats.push(options.format);
        if (options.format === 'pptx')
          assert.ok(options.spec.slides.length > 0);
      },
    });
    assert.deepEqual(formats, ['pdf', 'pptx']);
    const previousEvidence = path.join(output, 'source', 'visual-qa', 'pdf');
    await writeFile(
      path.join(previousEvidence, 'obsolete.png'),
      'ancienne page',
    );
    await main([...args, '--operation', 'visual-qa'], {
      visualRenderer: async (options) => {
        assert.deepEqual(await readdir(options.output), []);
      },
    });
    const specPath = path.join(output, 'source', 'presentation.json');
    const spec = JSON.parse(await readFile(specPath, 'utf8'));
    spec.slides[0].title = 'Altéré';
    await writeFile(specPath, JSON.stringify(spec));
    await assert.rejects(
      main([
        '--source',
        source,
        '--format',
        'pptx',
        '--output',
        output,
        '--operation',
        'visual-qa',
      ]),
      /Spécification/,
    );
    await main([
      '--source',
      source,
      '--format',
      'pdf',
      '--output',
      output,
      '--operation',
      'visual-qa',
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
