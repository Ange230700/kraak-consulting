import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import sharp from 'sharp';

const execute = promisify(execFile);

test('Given un document illustré When les trois formats sont générés Then le PDF est balisé, le PPTX éditable et les empreintes exactes', async () => {
  const root = path.resolve('.artifacts');
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, 'export-integration-'));
  try {
    const source = path.join(directory, 'source.md');
    const content =
      '---\n# Mission KRAAK\n\nDévelopper les compétences.\n\n---\n\n[Consulter les services](#services)\n\n## Services\n\nFormation.\n\n![Illustration KRAAK](image.png)\n' +
      '\nParagraphe de formation.'.repeat(30);
    await writeFile(source, content);
    await sharp({
      create: { width: 20, height: 10, channels: 3, background: '#173e50' },
    })
      .png()
      .toFile(path.join(directory, 'image.png'));
    const { stdout } = await execute(process.execPath, [
      'scripts/export-docs.mjs',
      '--source',
      source,
      '--format',
      'all',
      '--output',
      directory,
    ]);
    assert.equal(stdout.match(/\[docs:export\]/g)?.length, 3);
    for (const format of ['txt', 'pdf', 'pptx']) {
      const destination = path.join(directory, 'source', `source.${format}`);
      const artifact = await readFile(destination);
      const metadata = JSON.parse(
        await readFile(`${destination}.json`, 'utf8'),
      );
      assert.equal(
        metadata.sourceSha256,
        createHash('sha256').update(content).digest('hex'),
      );
      assert.equal(
        metadata.artifactSha256,
        createHash('sha256').update(artifact).digest('hex'),
      );
      if (format === 'txt') {
        assert.match(artifact.toString('utf8'), /Développer les compétences/);
        assert.match(
          artifact.toString('utf8'),
          /Illustration : Illustration KRAAK/,
        );
      } else if (format === 'pdf') {
        assert.equal(artifact.subarray(0, 5).toString(), '%PDF-');
        assert.ok(artifact.includes(Buffer.from('/StructTreeRoot')));
        assert.ok(artifact.includes(Buffer.from('/Subtype /Image')));
        assert.ok(artifact.includes(Buffer.from('/Subtype /Link')));
        assert.ok(artifact.includes(Buffer.from('/Dest ')));
      } else {
        const xml = artifact.toString('utf8');
        assert.equal(artifact.subarray(0, 2).toString(), 'PK');
        assert.match(xml, /<a:t>Mission KRAAK<\/a:t>/);
        assert.match(xml, /Développer les compétences/);
        assert.match(xml, /ppt\/media\/.*\.png/);
        assert.match(xml, /ppt\/notesSlides\/notesSlide1\.xml/);
        assert.match(xml, /\(suite\)/);
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
