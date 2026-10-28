import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import path from 'node:path';
import { sha256 } from './identity.mjs';

export const normalizeText = (text) =>
  text.normalize('NFKC').replaceAll('\u00ad', '').replace(/\s+/gu, '').trim();

export async function openPdf(bytes) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  return getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;
}

export async function verifyPdf(bytes, document) {
  const pdf = await openPdf(bytes);
  try {
    const metadata = await pdf.getMetadata();
    const pages = [];
    const headingTags = [];
    const roles = (node) =>
      [node.role, ...(node.children ?? []).flatMap(roles)].filter(Boolean);
    let tagged = true;
    let images = 0;
    const links = [];
    const { OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(' '));
      const tree = await page.getStructTree();
      tagged &&= Boolean(tree);
      if (tree)
        headingTags.push(
          ...roles(tree).filter((role) => /^H[1-6]$/.test(role)),
        );
      links.push(
        ...(await page.getAnnotations()).filter(
          (entry) => entry.subtype === 'Link',
        ),
      );
      const operators = await page.getOperatorList();
      images += operators.fnArray.filter((operator) =>
        [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operator),
      ).length;
    }
    const text = normalizeText(pages.join(' '));
    let cursor = 0;
    for (const block of document.semanticBlocks) {
      const expected = normalizeText(block.replaceAll('Illustration : ', ''));
      const position = text.indexOf(expected, cursor);
      if (position < 0)
        throw new Error(
          `PDF : contenu manquant ou ordre incorrect : ${block.slice(0, 100)}`,
        );
      cursor = position + expected.length;
    }
    const expectedText = normalizeText(document.semanticBlocks.join(' '));
    for (const block of document.semanticBlocks.filter(
      (block) => block.length > 80,
    )) {
      const normalized = normalizeText(block);
      if (text.split(normalized).length > expectedText.split(normalized).length)
        throw new Error('PDF : contenu substantiel dupliqué.');
    }
    if (!pdf.numPages || !tagged)
      throw new Error('PDF : pages ou structure balisée absentes.');
    let headingCursor = 0;
    for (const heading of document.headings) {
      const position = headingTags.indexOf(`H${heading.depth}`, headingCursor);
      if (position < 0)
        throw new Error('PDF : hiérarchie des titres incorrecte.');
      headingCursor = position + 1;
    }
    if (metadata.info.Title !== document.title)
      throw new Error('PDF : titre incorrect.');
    if (metadata.info.Language !== document.language)
      throw new Error(`PDF : langue incorrecte (${metadata.info.Language}).`);
    for (const href of document.links) {
      if (href.startsWith('#')) {
        if (!links.some((link) => link.dest))
          throw new Error('PDF : lien interne absent.');
      } else if (
        /^https?:/i.test(href) &&
        !links.some(
          (link) =>
            link.url === href ||
            link.unsafeUrl === href ||
            link.url === `${href}/`,
        )
      )
        throw new Error(`PDF : lien absent : ${href}`);
    }
    if (images < document.images.length + document.diagrams.length)
      throw new Error('PDF : illustration manquante.');
    return {
      schemaVersion: 1,
      status: 'passed',
      pageCount: pdf.numPages,
      tagged,
      headingTags,
      language: metadata.info.Language,
      title: metadata.info.Title,
      images,
      links: links.length,
      matchedBlocks: document.semanticBlocks.length,
      semanticSha256: sha256(text),
      artifactSha256: sha256(bytes),
      accessibility:
        'Structure balisée vérifiée ; conformité PDF/UA non établie.',
    };
  } finally {
    await pdf.destroy();
  }
}

const elements = (root, name) =>
  Array.from(root.getElementsByTagName('*')).filter(
    (element) => element.localName === name,
  );
const textContent = (xml) =>
  elements(xml, 't')
    .map((node) => node.textContent)
    .join(' ');
function parseXml(source, label) {
  const errors = [];
  const xml = new DOMParser({
    errorHandler: (_level, message) => errors.push(message),
  }).parseFromString(source, 'application/xml');
  if (errors.length || /<!DOCTYPE/i.test(source))
    throw new Error(`OOXML : XML invalide : ${label}`);
  return xml;
}

export async function verifyPptx(bytes, spec) {
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  const files = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  if (
    files.some(
      (name) =>
        zip.files[name].unsafeOriginalName &&
        zip.files[name].unsafeOriginalName !== name,
    )
  )
    throw new Error('OOXML : chemin ZIP non sûr.');
  for (const name of [
    '[Content_Types].xml',
    '_rels/.rels',
    'ppt/presentation.xml',
    'ppt/_rels/presentation.xml.rels',
    'docProps/core.xml',
  ])
    if (!zip.file(name)) throw new Error(`OOXML : partie manquante : ${name}`);
  const xml = new Map();
  for (const name of files.filter((name) => /\.(xml|rels)$/.test(name)))
    xml.set(name, parseXml(await zip.file(name).async('string'), name));
  const referenced = new Set();
  const relationships = new Map();
  for (const [name, tree] of xml) {
    if (!name.endsWith('.rels')) continue;
    const base =
      name === '_rels/.rels'
        ? ''
        : path.posix.dirname(path.posix.dirname(name));
    const targets = new Map();
    for (const relationship of elements(tree, 'Relationship')) {
      const id = relationship.getAttribute('Id');
      if (!id || targets.has(id))
        throw new Error(`OOXML : relation dupliquée : ${name}`);
      const external = relationship.getAttribute('TargetMode') === 'External';
      const raw = relationship.getAttribute('Target');
      const target = path.posix.normalize(
        raw.startsWith('/') ? raw.slice(1) : path.posix.join(base, raw),
      );
      if (!external && (target.startsWith('../') || !zip.file(target)))
        throw new Error(`OOXML : relation cassée : ${name} -> ${target}`);
      if (!external) referenced.add(target);
      targets.set(id, {
        target,
        external,
        type: relationship.getAttribute('Type'),
      });
    }
    relationships.set(name, targets);
  }
  for (const [name, tree] of xml) {
    if (name.endsWith('.rels')) continue;
    const rels = relationships.get(
      path.posix.join(
        path.posix.dirname(name),
        '_rels',
        `${path.posix.basename(name)}.rels`,
      ),
    );
    for (const node of Array.from(tree.getElementsByTagName('*'))) {
      for (const attribute of Array.from(node.attributes)) {
        if (
          attribute.namespaceURI ===
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships' &&
          !rels?.has(attribute.value)
        )
          throw new Error(`OOXML : référence non résolue : ${name}`);
      }
    }
  }
  for (const name of files.filter((name) =>
    /^ppt\/(slides\/slide\d+\.xml|notesSlides\/notesSlide\d+\.xml|media\/)/.test(
      name,
    ),
  ))
    if (!referenced.has(name))
      throw new Error(`OOXML : ressource orpheline : ${name}`);
  const presentation = xml.get('ppt/presentation.xml');
  const ids = elements(presentation, 'sldId');
  if (ids.length !== spec.slides.length)
    throw new Error('OOXML : nombre de diapositives incorrect.');
  const size = elements(presentation, 'sldSz')[0];
  const bounds = {
    width: Number(size?.getAttribute('cx')),
    height: Number(size?.getAttribute('cy')),
  };
  if (!bounds.width || !bounds.height)
    throw new Error('OOXML : dimensions absentes.');
  const records = [];
  let tables = 0;
  for (const [index, id] of ids.entries()) {
    const target = relationships
      .get('ppt/_rels/presentation.xml.rels')
      .get(id.getAttribute('r:id'))?.target;
    const slide = xml.get(target);
    if (!slide) throw new Error('OOXML : relation de diapositive invalide.');
    const expected = spec.slides[index];
    const text = normalizeText(textContent(slide));
    const expectedText =
      expected.kind === 'table' ? expected.rows.flat() : [expected.text ?? ''];
    for (const value of [expected.title, ...expectedText])
      if (!text.includes(normalizeText(value)) && expected.kind !== 'image')
        throw new Error(
          `OOXML : contenu absent sur la diapositive ${index + 1}`,
        );
    if (!text.includes(normalizeText(expected.title)))
      throw new Error('OOXML : titre absent.');
    const editableObjects = elements(slide, 'txBody').length;
    if (!editableObjects) throw new Error('OOXML : aucun texte éditable.');
    tables += elements(slide, 'tbl').length;
    if (expected.kind === 'table' && !elements(slide, 'tbl').length)
      throw new Error('OOXML : tableau natif absent.');
    if (expected.kind === 'image' && !elements(slide, 'pic').length)
      throw new Error('OOXML : image absente.');
    for (const transform of elements(slide, 'xfrm')) {
      const offset = elements(transform, 'off')[0];
      const extent = elements(transform, 'ext')[0];
      if (!offset || !extent)
        throw new Error('OOXML : transformation sans dimensions.');
      const values = ['x', 'y']
        .map((key) => Number(offset.getAttribute(key)))
        .concat(['cx', 'cy'].map((key) => Number(extent.getAttribute(key))));
      const [x, y, w, h] = values;
      if (
        !values.every(Number.isFinite) ||
        x < 0 ||
        y < 0 ||
        w < 0 ||
        h < 0 ||
        x + w > bounds.width + 10 ||
        y + h > bounds.height + 10
      )
        throw new Error(
          `OOXML : objet hors limites sur la diapositive ${index + 1}`,
        );
    }
    const relPath = path.posix.join(
      path.posix.dirname(target),
      '_rels',
      `${path.posix.basename(target)}.rels`,
    );
    const notes = [...(relationships.get(relPath)?.values() ?? [])].find(
      (entry) => entry.type.endsWith('/notesSlide'),
    );
    if (
      !notes ||
      !normalizeText(textContent(xml.get(notes.target))).includes(
        normalizeText(expected.notes),
      )
    )
      throw new Error(`OOXML : notes absentes sur la diapositive ${index + 1}`);
    records.push({
      index: index + 1,
      editableObjects,
      textSha256: sha256(text),
    });
  }
  return {
    schemaVersion: 1,
    status: 'passed',
    slideCount: records.length,
    tables,
    slides: records,
    specSha256: spec.sha256,
    artifactSha256: sha256(bytes),
    limitations: [
      'Les collisions de texte et la lisibilité nécessitent la QA visuelle.',
    ],
  };
}
