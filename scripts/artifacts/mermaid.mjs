import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { DOMParser } from '@xmldom/xmldom';
import { atomicWrite, sha256, stableJson, renderSpec } from './identity.mjs';

const require = createRequire(import.meta.url);
const configuration = Object.freeze({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  deterministicIds: true,
  htmlLabels: false,
  fontFamily: 'Arial',
  flowchart: { htmlLabels: false },
  themeVariables: {
    primaryColor: '#edf3f5',
    primaryTextColor: '#182b3a',
    primaryBorderColor: '#173e50',
    lineColor: '#173e50',
  },
});

function validateSvg(svg) {
  const errors = [];
  const xml = new DOMParser({
    errorHandler: (_level, message) => errors.push(message),
  }).parseFromString(svg, 'image/svg+xml');
  const dimensions = xml.documentElement
    .getAttribute('viewBox')
    .split(/\s+/)
    .map(Number);
  if (
    errors.length ||
    xml.documentElement.localName !== 'svg' ||
    dimensions.length !== 4 ||
    !dimensions.every(Number.isFinite) ||
    dimensions[2] <= 0 ||
    dimensions[3] <= 0 ||
    /<script\b|<foreignObject\b|\son\w+=|(?:href|src)=["'](?:https?:|file:)/i.test(
      svg,
    )
  )
    throw new Error(
      `SVG Mermaid invalide ou ressource externe interdite : ${errors.join('; ')} ; dimensions ${dimensions.join(',')} ; élément ${svg.match(/<foreignObject\b|<script\b/)?.[0] ?? 'aucun'}`,
    );
  return { width: dimensions[2], height: dimensions[3] };
}

export async function renderDiagrams(document, output) {
  if (!document.diagrams.length) return [];
  const browser = await chromium.launch();
  const renderer = {
    engineVersion: renderSpec.version,
    sharp: sharp.versions,
    mermaid: renderSpec.mermaid,
    playwright: require('playwright/package.json').version,
    chromium: browser.version(),
    platform: process.platform,
    configuration,
  };
  try {
    const page = await browser.newPage({
      viewport: { width: 1400, height: 1000 },
    });
    await page.route('**/*', (route) => route.abort());
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({
      path: path.join(
        path.dirname(require.resolve('mermaid/package.json')),
        'dist/mermaid.min.js',
      ),
    });
    const results = [];
    for (const diagram of document.diagrams) {
      if (/%%\{|^\s*---|\bclick\s/im.test(diagram.definition))
        throw new Error(
          `Mermaid ${diagram.id} : configuration et interactions intégrées interdites.`,
        );
      const renderHash = sha256(
        stableJson({ definition: diagram.definition, renderer }),
      );
      const svgPath = path.join(output, `${renderHash}.svg`);
      const pngPath = path.join(output, `${renderHash}.png`);
      const recordPath = path.join(output, `${renderHash}.json`);
      let record;
      try {
        const cached = JSON.parse(await readFile(recordPath, 'utf8'));
        const svg = await readFile(svgPath, 'utf8');
        const png = await readFile(pngPath);
        validateSvg(svg);
        const info = await sharp(png).metadata();
        if (
          cached.renderHash !== renderHash ||
          cached.svgSha256 !== sha256(svg) ||
          cached.pngSha256 !== sha256(png) ||
          !info.width ||
          !info.height
        )
          throw new Error('Empreinte ou dimensions du cache incorrectes.');
        record = cached;
      } catch (error) {
        console.debug(
          `[docs:mermaid] Cache absent ou invalide (${diagram.id}) : ${error.code ?? error.message}`,
        );
      }
      if (!record) {
        let svg;
        try {
          svg = await page.evaluate(
            async ({ definition, config, id }) => {
              const mermaid = globalThis.mermaid;
              mermaid.initialize({ ...config, deterministicIDSeed: id });
              const result = await mermaid.render(`m${id}`, definition);
              return result.svg;
            },
            {
              definition: diagram.definition,
              config: configuration,
              id: renderHash,
            },
          );
        } catch (error) {
          console.error(
            `[docs:mermaid] Syntaxe invalide : ${diagram.id}`,
            error.message,
          );
          throw new Error(`Mermaid ${diagram.id} : ${error.message}`, {
            cause: error,
          });
        }
        const dimensions = validateSvg(svg);
        const png = await sharp(Buffer.from(svg)).png().toBuffer();
        record = {
          schemaVersion: 1,
          renderHash,
          renderer,
          ...dimensions,
          svgSha256: sha256(svg),
          pngSha256: sha256(png),
        };
        await atomicWrite(svgPath, svg);
        await atomicWrite(pngPath, png);
        await atomicWrite(recordPath, stableJson(record));
      }
      results.push({
        ...record,
        id: diagram.id,
        sourceSha256: diagram.sourceSha256,
        title: diagram.title,
        description: diagram.description,
        svgPath,
        pngPath,
      });
    }
    return results;
  } finally {
    await browser.close();
  }
}
