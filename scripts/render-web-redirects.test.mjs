import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const renderYaml = readFileSync(join(repoRoot, 'render.yaml'), 'utf8');
const routeModel = JSON.parse(
  readFileSync(
    join(
      repoRoot,
      'apps',
      'client',
      'projects',
      'web',
      'src',
      'app',
      'routing',
      'localized-public-routes.json',
    ),
    'utf8',
  ),
);

test('Given Render static services, When redirect routes are inspected, Then every supported legacy public redirect is declared twice', () => {
  for (const rule of buildExpectedRenderRedirects(routeModel)) {
    assert.equal(countLine(`        source: ${rule.source}`), 2);
    assert.ok(countLine(`        destination: ${rule.destination}`) >= 2);
  }
});

test('Given the Render root limitation, When redirect routes are inspected, Then no root source redirect is declared in render.yaml', () => {
  assert.equal(countLine('        source: /'), 0);
});

test('Given Render static redirects, When route types are inspected, Then only redirect actions are added for the web static services', () => {
  const expectedRedirectCount =
    buildExpectedRenderRedirects(routeModel).length * 2;

  assert.equal(countLine('      - type: redirect'), expectedRedirectCount);
});

function buildExpectedRenderRedirects(model) {
  return model.pages.flatMap((page) =>
    (page.legacyAliases ?? [])
      .filter((source) => source !== '/')
      .flatMap((source) => [
        {
          source,
          destination: page.paths['fr-CI'],
        },
        {
          source: `${source}/`,
          destination: page.paths['fr-CI'],
        },
      ]),
  );
}

function countLine(expectedLine) {
  return renderYaml.split(/\r?\n/).filter((line) => line === expectedLine)
    .length;
}
