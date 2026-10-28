import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { main, createDocument } from '../export-docs.mjs';
import { verifyArtifact } from './engine.mjs';

test('Given des sources bilingues illustrées When deux exports réels sont produits Then TXT, Mermaid et structures restent reproductibles', async () => {
  await mkdir('.artifacts', { recursive: true });
  const root = await mkdtemp(path.resolve('.artifacts/pipeline-'));
  try {
    for (const language of ['fr', 'en']) {
      const source = path.join(root, `document ${language}.md`);
      const fixture = await readFile(
        new URL(`./fixtures/document-${language}.md`, import.meta.url),
        'utf8',
      );
      await sharp({
        create: { width: 100, height: 60, channels: 3, background: '#173e50' },
      })
        .png()
        .toFile(path.join(root, 'local image.png'));
      await writeFile(
        source,
        `${fixture}\n\n![Équipe](local%20image.png)\n\n${'Un accompagnement adapté à chaque équipe. '.repeat(100)}\n`,
      );
      const snapshots = [];
      for (const run of ['one', 'two']) {
        const output = path.join(root, run);
        await main(['--source', source, '--format', 'all', '--output', output]);
        await main(['--source', source, '--format', 'tts', '--output', output]);
        const directory = path.join(output, `document ${language}`);
        const records = {};
        for (const format of ['txt', 'tts', 'pdf', 'pptx']) {
          const destination = path.join(
            directory,
            `document ${language}.${format === 'tts' ? 'tts.txt' : format}`,
          );
          const document = createDocument(await readFile(source, 'utf8'));
          const report = await verifyArtifact(document, {
            source,
            destination,
            format,
          });
          records[format] = report;
          if (format === 'txt' || format === 'tts')
            records[format] = await readFile(destination, 'utf8');
        }
        const pdfRecord = JSON.parse(
          await readFile(
            path.join(directory, `document ${language}.pdf.json`),
            'utf8',
          ),
        );
        records.diagrams = pdfRecord.resources
          .filter((resource) => resource.id)
          .map((resource) => resource.svgSha256);
        snapshots.push(records);
      }
      assert.equal(snapshots[0].txt, snapshots[1].txt);
      assert.equal(snapshots[0].tts, snapshots[1].tts);
      assert.deepEqual(snapshots[0].diagrams, snapshots[1].diagrams);
      assert.equal(
        snapshots[0].pdf.semanticSha256,
        snapshots[1].pdf.semanticSha256,
      );
      assert.deepEqual(snapshots[0].pptx.slides, snapshots[1].pptx.slides);
      assert.equal(snapshots[0].pptx.specSha256, snapshots[1].pptx.specSha256);
      await sharp({
        create: { width: 100, height: 60, channels: 3, background: '#ffffff' },
      })
        .png()
        .toFile(path.join(root, 'local image.png'));
      await assert.rejects(
        verifyArtifact(createDocument(await readFile(source, 'utf8')), {
          source,
          format: 'pptx',
          destination: path.join(
            root,
            'two',
            `document ${language}`,
            `document ${language}.pptx`,
          ),
        }),
        /Illustration source modifiée/,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
