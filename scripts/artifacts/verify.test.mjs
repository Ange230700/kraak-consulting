import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import JSZip from 'jszip';
import { createDocument, exportDocument } from '../export-docs.mjs';
import { verifyPdf, verifyPptx } from './verify.mjs';
import { createPresentation } from './presentation.mjs';
import { renderPdf } from './render.mjs';

test('Given un tableau multipage et plusieurs ancres When le PDF est vérifié Then les en-têtes répétés sont permis et chaque ancre est contrôlée', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kraak-pdf-table-'));
  try {
    const header =
      'Description détaillée des résultats attendus pour les équipes et les organisations participantes';
    const source =
      `# Mission\n\n[Mission](#mission) [Tableau](#tableau)\n\n## Tableau\n\n| ${header} |\n| --- |\n` +
      Array.from(
        { length: 90 },
        (_, i) => `| Résultat attendu numéro ${i + 1} |`,
      ).join('\n');
    const document = createDocument(source);
    const file = path.join(root, 'table.pdf');
    await renderPdf(document, file, []);
    const bytes = await readFile(file);
    const report = await verifyPdf(bytes, document);
    assert.ok(report.pageCount > 1);
    await assert.rejects(
      verifyPdf(bytes, { ...document, links: ['#mission', '#absent'] }),
      /interne/,
    );
    const missingDestination = Buffer.from(
      bytes.toString('latin1').replaceAll('/Dests', '/NoDst'),
      'latin1',
    );
    await assert.rejects(verifyPdf(missingDestination, document), /interne/);
    const wrongTarget = Buffer.from(
      bytes.toString('latin1').replace('/Dest /tableau', '/Dest /mission'),
      'latin1',
    );
    await assert.rejects(verifyPdf(wrongTarget, document), /interne/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Given un tableau natif avec valeurs répétées When les cellules ou lignes sont altérées Then leur ordre et multiplicité sont vérifiés', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kraak-pptx-table-'));
  try {
    const document = createDocument(
      '# Mission\n\n| Offre | Public |\n| --- | --- |\n| Conseil | Équipes |\n| Conseil | Équipes |',
    );
    const file = path.join(root, 'table.pptx');
    await exportDocument(document, { format: 'pptx', destination: file });
    const bytes = await readFile(file);
    const spec = createPresentation(document);
    const index = spec.slides.findIndex((s) => s.kind === 'table') + 1;
    const part = `ppt/slides/slide${index}.xml`;
    for (const change of [
      (xml) =>
        xml
          .replaceAll('Conseil', 'TEMP')
          .replaceAll('Équipes', 'Conseil')
          .replaceAll('TEMP', 'Équipes'),
      (xml) => {
        let removed = false;
        return xml.replace(/<a:tr\b[^>]*>.*?<\/a:tr>/gs, (row) => {
          if (!removed && row.includes('Conseil')) {
            removed = true;
            return '';
          }
          return row;
        });
      },
      (xml) => xml.replace(/<a:tbl>.*?<\/a:tbl>/s, '$&$&'),
    ]) {
      const zip = await JSZip.loadAsync(bytes);
      zip.file(part, change(await zip.file(part).async('string')));
      await assert.rejects(
        verifyPptx(await zip.generateAsync({ type: 'nodebuffer' }), spec),
        /tableau|contenu/,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Given un PDF valide When sa structure ou les attentes sont altérées Then chaque contrôle sémantique échoue explicitement', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kraak-pdf-negative-'));
  try {
    const paragraph =
      'Une formation rigoureuse et accessible aide chaque équipe à définir ses objectifs et à relire les résultats attendus.';
    const document = createDocument(`# Mission\n\n${paragraph}`);
    const file = path.join(root, 'test.pdf');
    await renderPdf(document, file, []);
    const bytes = await readFile(file);
    await assert.rejects(
      verifyPdf(bytes, {
        ...document,
        headings: [{ depth: 6, text: 'Mission' }],
      }),
      /hiérarchie/,
    );
    for (const [change, expected] of [
      [{ title: 'Autre' }, /titre/],
      [{ language: 'en-GB' }, /langue/],
      [{ links: ['#absent'] }, /interne/],
      [{ links: ['https://missing.invalid'] }, /lien absent/],
      [{ images: [{ title: 'Absent' }] }, /illustration/],
    ])
      await assert.rejects(
        verifyPdf(bytes, { ...document, ...change }),
        expected,
      );
    const untagged = Buffer.from(
      bytes.toString('latin1').replaceAll('/StructTreeRoot', '/StructTreeNope'),
      'latin1',
    );
    await assert.rejects(verifyPdf(untagged, document), /structure balisée/);
    await renderPdf(
      createDocument(`# Mission\n\n${paragraph}\n\n${paragraph}`),
      file,
      [],
    );
    await assert.rejects(verifyPdf(await readFile(file), document), /dupliqué/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Given un PDF et un PPTX réels When les vérificateurs indépendants inspectent les sorties Then contenu et structure sont prouvés', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kraak-verify-'));
  try {
    const document = createDocument(
      '# Équipe\n\nFormation et impact.\n\n[Services](https://example.org)\n\n| Offre | Public |\n| --- | --- |\n| Conseil | Équipes |',
    );
    for (const format of ['pdf', 'pptx'])
      await exportDocument(document, {
        format,
        destination: path.join(directory, `test.${format}`),
      });
    const pdf = await verifyPdf(
      await readFile(path.join(directory, 'test.pdf')),
      document,
    );
    assert.ok(pdf.pageCount > 0);
    assert.ok(pdf.tagged);
    assert.ok(pdf.headingTags.includes('H1'));
    const bytes = await readFile(path.join(directory, 'test.pptx'));
    const spec = createPresentation(document);
    const pptx = await verifyPptx(bytes, spec);
    assert.equal(pptx.slideCount, spec.slides.length);
    assert.ok(pptx.tables > 0);
    await assert.rejects(verifyPptx(bytes, { ...spec, slides: [] }), /nombre/);
    for (const change of [
      { title: 'Titre absent' },
      { kind: 'image' },
      { kind: 'table', rows: [['Équipe']] },
      { text: 'Contenu absent' },
      { kind: 'image', title: 'Absent', text: undefined },
    ]) {
      const slides = structuredClone(spec.slides);
      Object.assign(slides[0], change);
      await assert.rejects(verifyPptx(bytes, { ...spec, slides }), /OOXML/);
    }
    const alter = (file, pattern, replacement) => async (zip) =>
      zip.file(
        file,
        (await zip.file(file).async('string')).replace(pattern, replacement),
      );
    const slideFile = 'ppt/slides/slide1.xml';
    const relationFile = 'ppt/_rels/presentation.xml.rels';
    for (const corrupt of [
      (zip) => zip.remove('[Content_Types].xml'),
      (zip) => zip.file('../unsafe.xml', '<root/>'),
      alter(slideFile, /<p:spTree>/, '<p:spTree r:embed="missing">'),
      alter(slideFile, /p:txBody/g, 'p:noBody'),
      alter('ppt/presentation.xml', /<p:sldSz cx="[^"]+"/, '<p:sldSz cx="0"'),
      alter(
        relationFile,
        /<\/Relationships>/,
        '<Relationship Id="rId1" Target="slides/slide1.xml" Type="test"/></Relationships>',
      ),
      alter('ppt/slides/_rels/slide1.xml.rels', /\/notesSlide"/, '/unknown"'),
      alter('ppt/notesSlides/notesSlide1.xml', /Équipe/g, 'Absent'),
      alter(slideFile, /<a:off[^>]+\/>/, ''),
      async (zip) => {
        await alter(
          relationFile,
          'Target="slides/slide1.xml"',
          'Target="media/not-slide.png"',
        )(zip);
        zip.file('ppt/media/not-slide.png', 'not XML');
      },
      async (zip) => {
        zip.remove('ppt/slides/_rels/slide1.xml.rels');
        await alter(
          '_rels/.rels',
          '</Relationships>',
          '<Relationship Id="notes" Target="ppt/notesSlides/notesSlide1.xml" Type="notes"/></Relationships>',
        )(zip);
      },
      ...['x="-1"', 'x="NaN"'].map((value) =>
        alter(slideFile, /x="548640"/, value),
      ),
      alter(slideFile, /y="320040"/, 'y="-1"'),
      alter(
        slideFile,
        /<a:ext cx="[^"]+" cy="[^"]+"/,
        '<a:ext cx="999999999" cy="999999999"',
      ),
    ]) {
      const damaged = await JSZip.loadAsync(bytes);
      await corrupt(damaged);
      await assert.rejects(
        verifyPptx(await damaged.generateAsync({ type: 'nodebuffer' }), spec),
        /OOXML/,
      );
    }
    const absolute = await JSZip.loadAsync(bytes);
    await alter(
      relationFile,
      'Target="slides/slide1.xml"',
      'Target="/ppt/slides/slide1.xml"',
    )(absolute);
    assert.equal(
      (
        await verifyPptx(
          await absolute.generateAsync({ type: 'nodebuffer' }),
          spec,
        )
      ).status,
      'passed',
    );
    for (const corrupt of [
      (zip) => zip.file('ppt/slides/slide1.xml', '<invalid>'),
      async (zip) => {
        const file = 'ppt/_rels/presentation.xml.rels';
        zip.file(
          file,
          (await zip.file(file).async('string')).replace(
            'slides/slide1.xml',
            'slides/missing.xml',
          ),
        );
      },
      (zip) => zip.file('ppt/media/orphan.png', 'orphan'),
      async (zip) => {
        const file = 'ppt/slides/slide1.xml';
        zip.file(
          file,
          (await zip.file(file).async('string')).replace(
            'x="548640"',
            'x="999999999"',
          ),
        );
      },
      (zip) => zip.remove('ppt/notesSlides/notesSlide1.xml'),
    ]) {
      const damaged = await JSZip.loadAsync(bytes);
      await corrupt(damaged);
      await assert.rejects(
        verifyPptx(await damaged.generateAsync({ type: 'nodebuffer' }), spec),
        /OOXML/,
      );
    }
    const zip = await JSZip.loadAsync(bytes);
    zip.remove('ppt/slides/slide1.xml');
    await assert.rejects(
      verifyPptx(await zip.generateAsync({ type: 'nodebuffer' }), spec),
      /relation|partie|slide/i,
    );
    await assert.rejects(verifyPdf(Buffer.from('corrompu'), document));
    await assert.rejects(
      verifyPdf(
        await readFile(path.join(directory, 'test.pdf')),
        createDocument('# Absent\n\nContenu absent.'),
      ),
      /contenu|titre/i,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
