import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createDocument, exportDocument } from '../export-docs.mjs';
import { visualQa, resolveOfficeExecutable } from './visual-qa.mjs';

test('Given Windows, Linux et un chemin explicite When LibreOffice est recherché Then le bon exécutable est sélectionné', () => {
  assert.equal(resolveOfficeExecutable({}, 'linux'), 'libreoffice');
  assert.equal(
    resolveOfficeExecutable({ LIBREOFFICE_PATH: '/custom/office' }, 'linux'),
    '/custom/office',
  );
  assert.match(resolveOfficeExecutable({}, 'win32'), /soffice.com$/);
  assert.match(
    resolveOfficeExecutable({ ProgramFiles: 'D:/Apps' }, 'win32'),
    /D:/,
  );
});

function simulatedPdf({ pages = 1, blank = false, outside = false } = {}) {
  return {
    numPages: pages,
    destroy: async () => {},
    getPage: async () => ({
      view: [0, 0, 100, 100],
      getViewport: () => ({ width: 100, height: 100 }),
      render: ({ canvasContext }) => {
        canvasContext.fillStyle = '#ffffff';
        canvasContext.fillRect(0, 0, 100, 100);
        if (!blank) {
          canvasContext.fillStyle = '#173e50';
          canvasContext.fillRect(20, 20, 30, 30);
        }
        return { promise: Promise.resolve() };
      },
      getTextContent: async () => ({
        items: [
          {
            str: 'Title A B',
            transform: [1, 0, 0, 1, outside ? -10 : 10, 20],
            width: 30,
          },
          {},
        ],
      }),
    }),
  };
}

test('Given un convertisseur simulé When les contrôles de slides et leurs erreurs sont exercés Then les preuves distinguent conversion, contenu et mise en page', async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'kraak-visual-boundary-'),
  );
  try {
    const destination = path.join(directory, 'test.pptx');
    await writeFile(destination, 'deck');
    const runOffice = async (_, args) => {
      assert.ok(args[0].startsWith('-env:UserInstallation='));
      if (args.includes('--version')) return { stdout: 'Test office 1.0' };
      await writeFile(
        path.join(args[args.indexOf('--outdir') + 1], 'test.pdf'),
        'pdf',
      );
      return { stdout: '' };
    };
    const options = {
      destination,
      format: 'pptx',
      output: path.join(directory, 'qa'),
      runOffice,
      loadPdf: async () => simulatedPdf(),
    };
    for (const slide of [
      { kind: 'text', title: 'Title', text: 'A B' },
      { kind: 'table', title: 'Title', rows: [['A', 'B']] },
      { kind: 'image', title: 'Title' },
    ]) {
      const report = await visualQa({ ...options, spec: { slides: [slide] } });
      assert.equal(report.converter.version, 'Test office 1.0');
      assert.equal(report.pageCount, 1);
    }
    await assert.rejects(visualQa({ ...options, format: 'txt' }), /exige/);
    await assert.rejects(
      visualQa({
        ...options,
        runOffice: async () => {
          throw new Error('indisponible');
        },
      }),
      /LibreOffice/,
    );
    await assert.rejects(
      visualQa({ ...options, spec: { slides: [] } }),
      /nombre/,
    );
    await assert.rejects(
      visualQa({
        ...options,
        spec: { slides: [{ title: 'Absent', kind: 'image' }] },
      }),
      /texte perdu/,
    );
    await assert.rejects(
      visualQa({
        ...options,
        loadPdf: async () => simulatedPdf({ pages: 13, blank: true }),
      }),
      /page vide/,
    );
    const report = JSON.parse(
      await readFile(path.join(directory, 'qa', 'report.json'), 'utf8'),
    );
    assert.equal(report.contactSheets.length, 2);
    assert.equal(report.pages[0].blank, true);
    await assert.rejects(
      visualQa({
        ...options,
        loadPdf: async () => simulatedPdf({ outside: true }),
      }),
      /hors limites/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Given un PDF réel When la QA visuelle est exécutée Then les pages et la planche contact sont conservées', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-visual-'));
  try {
    const document = createDocument('# Équipe\n\nUne formation accessible.');
    const destination = path.join(directory, 'test.pdf');
    await exportDocument(document, { format: 'pdf', destination });
    const report = await visualQa({
      destination,
      format: 'pdf',
      output: path.join(directory, 'visual'),
    });
    assert.equal(report.pageCount, 1);
    assert.equal(report.pages[0].blank, false);
    assert.ok(
      (await readFile(path.join(directory, 'visual', 'contact-sheet-001.png')))
        .length > 1000,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
