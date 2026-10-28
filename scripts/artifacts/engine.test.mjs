import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createDocument } from './model.mjs';
import { exportDocument, verifyArtifact } from './engine.mjs';
import { directoryTransaction } from './transaction.mjs';
import { sha256 } from './identity.mjs';

test('Given des métadonnées altérées When un artefact est revérifié Then chaque incohérence est refusée indépendamment', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-tamper-'));
  try {
    const source = path.join(directory, 'source.md');
    const destination = path.join(directory, 'source.txt');
    const content = '# Source\n\nTexte canonique.';
    const document = createDocument(content);
    await writeFile(source, content);
    const original = await exportDocument(document, {
      source,
      destination,
      format: 'txt',
    });
    for (const [key, value, expected] of [
      ['schemaVersion', 0, /obsolète/],
      ['format', 'pdf', /obsolète/],
      ['configurationSha256', 'stale', /Configuration/],
      ['source', 'elsewhere.md', /Chemin source/],
    ]) {
      await writeFile(
        `${destination}.json`,
        JSON.stringify({ ...original, [key]: value }),
      );
      await assert.rejects(
        verifyArtifact(document, { source, destination, format: 'txt' }),
        expected,
      );
    }
    await writeFile(destination, 'Texte falsifié');
    await writeFile(
      `${destination}.json`,
      JSON.stringify({ ...original, artifactSha256: sha256('Texte falsifié') }),
    );
    await assert.rejects(
      verifyArtifact(document, { source, destination, format: 'txt' }),
      /modèle canonique/,
    );
    await writeFile(source, '# Source modifiée');
    await assert.rejects(
      exportDocument(document, { source, destination, format: 'txt' }),
      /Source modifiée/,
    );
    const diagramDocument = createDocument(
      '```mermaid\ngraph TD\naccDescr: De A vers B.\nA-->B\n```',
    );
    const record = await exportDocument(diagramDocument, {
      destination,
      format: 'txt',
    });
    const diagram = diagramDocument.diagrams[0];
    const resource = {
      id: diagram.id,
      sourceSha256: diagram.sourceSha256,
      svgPath: 'diagram.svg',
      pngPath: 'diagram.png',
      svgSha256: sha256('svg'),
      pngSha256: sha256('png'),
    };
    await writeFile(path.join(directory, 'diagram.svg'), 'svg');
    await writeFile(path.join(directory, 'diagram.png'), 'png');
    for (const [change, expected] of [
      [{ id: 'missing' }, /obsolète/],
      [{ svgPath: '../escape' }, /Chemin de ressource/],
      [{ svgPath: '/absolute' }, /Chemin de ressource/],
      [{ svgPath: '' }, /Chemin de ressource/],
      [{ svgSha256: 'corrupt' }, /corrompue/],
    ]) {
      await writeFile(
        `${destination}.json`,
        JSON.stringify({ ...record, resources: [{ ...resource, ...change }] }),
      );
      await assert.rejects(
        verifyArtifact(diagramDocument, { destination, format: 'txt' }),
        expected,
      );
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Given un transcript vérifié When la source ou le dérivé change Then la provenance obsolète est refusée', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-provenance-'));
  try {
    const source = path.join(directory, 'source.md');
    const destination = path.join(directory, 'source.tts.txt');
    const content = '# Mission\n\nFormation et autonomie.';
    await writeFile(source, content);
    const document = createDocument(content);
    await exportDocument(document, { source, destination, format: 'tts' });
    assert.equal(
      (await verifyArtifact(document, { source, destination, format: 'tts' }))
        .status,
      'passed',
    );
    await assert.rejects(
      verifyArtifact(createDocument(content + '\n\nSuite.'), {
        source,
        destination,
        format: 'tts',
      }),
      /obsolète/,
    );
    await writeFile(destination, 'corrompu');
    await assert.rejects(
      verifyArtifact(document, { source, destination, format: 'tts' }),
      /corrompu/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Given un export publié When une génération transactionnelle échoue Then les anciens fichiers restent intacts', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-transaction-'));
  try {
    await writeFile(path.join(directory, 'valid.txt'), 'valide');
    await assert.rejects(
      directoryTransaction(directory, async (temporary) => {
        await writeFile(path.join(temporary, 'valid.txt'), 'partiel');
        throw new Error('échec attendu');
      }),
      /attendu/,
    );
    assert.equal(
      await readFile(path.join(directory, 'valid.txt'), 'utf8'),
      'valide',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
