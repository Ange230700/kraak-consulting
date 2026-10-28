import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { createDocument } from './model.mjs';
import { renderPdf } from './render.mjs';

test('Given une figure sans description ou sans ressource When le PDF est rendu Then la légende sert d’alternative ou la génération échoue', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kraak-figure-'));
  try {
    const document = createDocument('```mermaid\ngraph TD; A-->B\n```');
    const file = path.join(root, 'test.pdf');
    await assert.rejects(renderPdf(document, file, []), /Mermaid manquante/);
    const png = await sharp({
      create: { width: 20, height: 10, channels: 3, background: '#173e50' },
    })
      .png()
      .toBuffer();
    await renderPdf(document, file, [
      {
        id: document.diagrams[0].id,
        title: 'Parcours',
        data: `data:image/png;base64,${png.toString('base64')}`,
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
