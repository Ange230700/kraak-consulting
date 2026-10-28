import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createDocument } from './artifacts/model.mjs';
import {
  exportDocument,
  verifyArtifact,
  supportedFormats,
  rendererIdentity,
} from './artifacts/engine.mjs';
import { atomicWrite, stableJson, sha256 } from './artifacts/identity.mjs';
import { directoryTransaction } from './artifacts/transaction.mjs';
import { chunkNarration, renderNarration } from './artifacts/narration.mjs';
export { createDocument, paginateSections } from './artifacts/model.mjs';
export { exportDocument } from './artifacts/engine.mjs';

const help = `Usage : pnpm docs:export --source document.md --format txt|tts|pdf|pptx|all
  [--output dossier] [--operation generate|plan|verify|visual-qa|provenance]
  [--chunk-size 4000]
--help : afficher cette aide ; --dry-run : planifier sans écrire.
all conserve les trois exports historiques ; demander tts séparément.
Les erreurs produisent le code de sortie 1. Aucun service distant requis.`;

export function parseArguments(args) {
  if (args.length === 1 && args[0] === '--help') return { help: true };
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index]?.replace(/^--/, '');
    if (name === 'dry-run') {
      options.operation = 'plan';
      continue;
    }
    if (
      !['source', 'format', 'output', 'operation', 'chunk-size'].includes(name)
    )
      throw new Error(`Option inconnue : ${args[index]}`);
    const value = args[++index];
    if (!value || value.startsWith('--') || options[name])
      throw new Error(`Valeur manquante ou option répétée : --${name}`);
    options[name] = value;
  }
  if (!options.source || ![...supportedFormats, 'all'].includes(options.format))
    throw new Error(help);
  if (
    options.operation &&
    !['generate', 'plan', 'verify', 'visual-qa', 'provenance'].includes(
      options.operation,
    )
  )
    throw new Error('Opération inconnue.');
  if (
    options['chunk-size'] &&
    (!Number.isInteger(Number(options['chunk-size'])) ||
      Number(options['chunk-size']) < 1 ||
      options.format !== 'tts')
  )
    throw new Error(
      'La taille de segment exige un entier positif et le format tts.',
    );
  return options;
}

export async function main(args, { visualRenderer } = {}) {
  const options = parseArguments(args);
  if (options.help) {
    console.info(help);
    return;
  }
  const source = path.resolve(options.source);
  if (path.extname(source).toLowerCase() !== '.md')
    throw new Error('La source doit être un fichier Markdown (.md).');
  const document = createDocument(await readFile(source, 'utf8'));
  const name = path.parse(source).name;
  const output = path.resolve(options.output ?? '.artifacts/docs', name);
  const sourceWithinOutput = path.relative(output, source);
  if (
    !sourceWithinOutput.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(sourceWithinOutput)
  )
    throw new Error(
      'Le dossier de sortie ne doit pas contenir la source canonique.',
    );
  const formats =
    options.format === 'all' ? ['txt', 'pdf', 'pptx'] : [options.format];
  const filename = (format) =>
    `${name}.${format === 'tts' ? 'tts.txt' : format}`;
  const operation = options.operation ?? 'generate';
  if (operation === 'plan') {
    console.info(
      stableJson({
        source,
        sourceSha256: document.sourceSha256,
        language: document.language,
        diagrams: document.diagrams.length,
        output,
        formats,
        renderer: await rendererIdentity(),
      }),
    );
    return;
  }
  if (operation === 'provenance') {
    for (const format of formats)
      console.info(
        await readFile(path.join(output, `${filename(format)}.json`), 'utf8'),
      );
    return;
  }
  if (operation === 'verify' || operation === 'visual-qa') {
    for (const format of formats) {
      if (operation === 'visual-qa' && !['pdf', 'pptx'].includes(format))
        continue;
      const destination = path.join(output, filename(format));
      const report = await verifyArtifact(document, {
        format,
        destination,
        source,
      });
      if (operation === 'visual-qa') {
        const { visualQa } = await import('./artifacts/visual-qa.mjs');
        const spec =
          format === 'pptx'
            ? JSON.parse(
                await readFile(path.join(output, 'presentation.json'), 'utf8'),
              )
            : undefined;
        if (spec) {
          const { sha256: identity, ...content } = spec;
          if (
            identity !== report.specSha256 ||
            sha256(stableJson(content)) !== identity
          )
            throw new Error('Spécification de présentation obsolète.');
        }
        await directoryTransaction(
          path.join(output, 'visual-qa', format),
          (directory) =>
            (visualRenderer ?? visualQa)({
              destination,
              format,
              output: directory,
              spec,
            }),
          { preserveFailure: true },
        );
      } else
        await atomicWrite(
          path.join(output, 'verification', `${format}.json`),
          stableJson(report),
        );
      console.info(`[docs:${operation}] ${destination}`);
    }
    return;
  }
  await directoryTransaction(output, async (directory) => {
    if (formats.includes('tts'))
      await rm(path.join(directory, 'narration'), {
        recursive: true,
        force: true,
      });
    const records = [];
    for (const format of formats)
      records.push(
        await exportDocument(document, {
          format,
          source,
          destination: path.join(directory, filename(format)),
        }),
      );
    if (options['chunk-size']) {
      const chunks = chunkNarration(
        renderNarration(document),
        Number(options['chunk-size']),
      );
      const chunking = {
        maximum: Number(options['chunk-size']),
        chunks: chunks.map((chunk, index) => ({
          file: `${String(index + 1).padStart(3, '0')}.txt`,
          sha256: sha256(`${chunk}\n`),
        })),
      };
      for (const [index, chunk] of chunks.entries())
        await atomicWrite(
          path.join(
            directory,
            'narration',
            `${String(index + 1).padStart(3, '0')}.txt`,
          ),
          `${chunk}\n`,
        );
      await atomicWrite(
        path.join(directory, 'narration', 'manifest.json'),
        stableJson({
          sourceSha256: document.sourceSha256,
          count: chunks.length,
          maximum: Number(options['chunk-size']),
          chunks: chunking.chunks,
          oversizedParagraphs: chunks.filter(
            (chunk) => chunk.length > Number(options['chunk-size']),
          ).length,
        }),
      );
      records[0].chunking = chunking;
      await atomicWrite(
        path.join(directory, `${filename('tts')}.json`),
        stableJson(records[0]),
      );
    }
    await atomicWrite(
      path.join(directory, 'manifest.json'),
      stableJson({
        schemaVersion: 1,
        source: path.relative(process.cwd(), source).replaceAll('\\', '/'),
        sourceSha256: document.sourceSha256,
        outputs: records,
      }),
    );
  });
  for (const format of formats)
    console.info(`[docs:export] ${path.join(output, filename(format))}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error('[docs:export] Échec de génération :', error);
    process.exitCode = 1;
  }
}
