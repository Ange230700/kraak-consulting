import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadImages, renderPdf, renderPptx } from './render.mjs';
import { renderNarration, chunkNarration } from './narration.mjs';
import { renderDiagrams } from './mermaid.mjs';
import { createPresentation } from './presentation.mjs';
import { verifyPdf, verifyPptx } from './verify.mjs';
import { atomicWrite, sha256, stableJson, renderSpec } from './identity.mjs';

const require = createRequire(import.meta.url);
export const supportedFormats = ['txt', 'tts', 'pdf', 'pptx'];
export async function rendererIdentity() {
  const modules = [
    'identity',
    'model',
    'narration',
    'mermaid',
    'presentation',
    'render',
    'verify',
    'engine',
  ];
  const code = await Promise.all(
    modules.map((name) => readFile(new URL(`./${name}.mjs`, import.meta.url))),
  );
  return {
    ...renderSpec,
    implementationSha256: sha256(Buffer.concat(code)),
    lockfileSha256: sha256(
      await readFile(new URL('../../pnpm-lock.yaml', import.meta.url)),
    ),
    playwright: require('playwright/package.json').version,
    node: process.version,
    platform: process.platform,
  };
}

async function verifyBytes(bytes, document, format, images) {
  if (format === 'pdf') return verifyPdf(bytes, document);
  if (format === 'pptx')
    return verifyPptx(bytes, createPresentation(document, images));
  const expected = format === 'tts' ? renderNarration(document) : document.text;
  if (!bytes.equals(Buffer.from(expected)))
    throw new Error('TXT : contenu différent du modèle canonique.');
  return {
    schemaVersion: 1,
    status: 'passed',
    artifactSha256: sha256(bytes),
    semanticSha256: sha256(expected),
  };
}

export async function exportDocument(
  document,
  { format, destination, source },
) {
  if (!supportedFormats.includes(format))
    throw new Error(`Format non pris en charge : ${format}`);
  if (
    document.hasMermaid &&
    !['txt', 'tts'].includes(format) &&
    (!source || source.endsWith('.marp.md'))
  )
    throw new Error(
      'Mermaid : fournir une source ordinaire ; les exports Marp exigent des images préalablement rendues.',
    );
  const visual = ['pdf', 'pptx'].includes(format);
  const images = visual ? await loadImages(document, source) : [];
  if (source && sha256(await readFile(source)) !== document.sourceSha256)
    throw new Error('Source modifiée depuis son analyse.');
  const diagrams = visual
    ? await renderDiagrams(
        document,
        path.join(path.dirname(destination), 'diagrams'),
      )
    : [];
  for (const diagram of diagrams)
    images.push({
      ...diagram,
      data: `data:image/png;base64,${(await readFile(diagram.pngPath)).toString('base64')}`,
    });
  const temporary = `${destination}.${randomUUID()}.tmp.${format}`;
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    if (format === 'pdf') await renderPdf(document, temporary, images);
    else if (format === 'pptx') await renderPptx(document, temporary, images);
    else
      await atomicWrite(
        temporary,
        format === 'tts' ? renderNarration(document) : document.text,
      );
    const bytes = await readFile(temporary);
    const verification = await verifyBytes(bytes, document, format, images);
    const renderer = await rendererIdentity();
    const resources = images.map(({ data, svgPath, pngPath, ...image }) => ({
      ...image,
      sha256: sha256(Buffer.from(data.split(',')[1], 'base64')),
      ...(svgPath
        ? {
            svgPath: path
              .relative(path.dirname(destination), svgPath)
              .replaceAll('\\', '/'),
            pngPath: path
              .relative(path.dirname(destination), pngPath)
              .replaceAll('\\', '/'),
          }
        : {}),
    }));
    const record = {
      schemaVersion: 1,
      source: source
        ? path.relative(process.cwd(), source).replaceAll('\\', '/')
        : null,
      sourceSha256: document.sourceSha256,
      artifactSha256: sha256(bytes),
      format,
      renderer,
      configurationSha256: sha256(stableJson(renderer)),
      resources,
      verification,
      generator: 'scripts/export-docs.mjs',
    };
    await rename(temporary, destination);
    await atomicWrite(`${destination}.json`, stableJson(record));
    await atomicWrite(
      path.join(path.dirname(destination), 'verification', `${format}.json`),
      stableJson(verification),
    );
    if (format === 'pptx')
      await atomicWrite(
        path.join(path.dirname(destination), 'presentation.json'),
        stableJson(createPresentation(document, images)),
      );
    return record;
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function verifyArtifact(
  document,
  { format, destination, source },
) {
  const record = JSON.parse(await readFile(`${destination}.json`, 'utf8'));
  const bytes = await readFile(destination);
  if (
    record.schemaVersion !== 1 ||
    record.format !== format ||
    record.sourceSha256 !== document.sourceSha256 ||
    record.artifactSha256 !== sha256(bytes)
  )
    throw new Error('Provenance obsolète ou artefact corrompu.');
  if (
    record.configurationSha256 !== sha256(stableJson(await rendererIdentity()))
  )
    throw new Error(
      'Configuration ou moteur obsolète : régénérer les artefacts.',
    );
  if (
    source &&
    record.source !== path.relative(process.cwd(), source).replaceAll('\\', '/')
  )
    throw new Error('Chemin source de provenance incorrect.');
  const localImages = ['pdf', 'pptx'].includes(format)
    ? await loadImages(document, source)
    : [];
  for (const [index, image] of localImages.entries())
    if (
      sha256(Buffer.from(image.data.split(',')[1], 'base64')) !==
      record.resources[index]?.sha256
    )
      throw new Error('Illustration source modifiée.');
  for (const resource of record.resources.filter((entry) => entry.id)) {
    if (
      !document.diagrams.some(
        (diagram) =>
          diagram.id === resource.id &&
          diagram.sourceSha256 === resource.sourceSha256,
      )
    )
      throw new Error('Diagramme source obsolète.');
    for (const extension of ['svg', 'png']) {
      const relative = resource[`${extension}Path`];
      if (
        !relative ||
        path.isAbsolute(relative) ||
        relative.split(/[\\/]/).includes('..')
      )
        throw new Error('Chemin de ressource invalide.');
      if (
        sha256(
          await readFile(path.join(path.dirname(destination), relative)),
        ) !== resource[`${extension}Sha256`]
      )
        throw new Error('Ressource Mermaid corrompue.');
    }
  }
  const images = [
    ...localImages,
    ...document.diagrams.map((diagram) => ({ ...diagram })),
  ];
  if (record.chunking) {
    const chunks = chunkNarration(
      renderNarration(document),
      record.chunking.maximum,
    ).map((chunk, index) => ({
      file: `${String(index + 1).padStart(3, '0')}.txt`,
      sha256: sha256(`${chunk}\n`),
    }));
    if (stableJson(chunks) !== stableJson(record.chunking.chunks))
      throw new Error('Segments : provenance incohérente.');
    for (const chunk of chunks)
      if (
        sha256(
          await readFile(
            path.join(path.dirname(destination), 'narration', chunk.file),
          ),
        ) !== chunk.sha256
      )
        throw new Error('Segment de narration corrompu.');
  }
  return verifyBytes(bytes, document, format, images);
}
