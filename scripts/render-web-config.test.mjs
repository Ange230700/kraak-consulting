import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const renderConfig = readFileSync(
  new URL('../render.yaml', import.meta.url),
  'utf8',
);

const extractServiceBlock = (name) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `- type: web[\\s\\S]*?name: ${escapedName}[\\s\\S]*?(?=\\n  - type: web|$)`,
  );
  const match = renderConfig.match(pattern);

  return match ? match[0] : '';
};

test('Given render.yaml, When reading staging web service, Then branch and autoDeploy match expected values', () => {
  const stagingBlock = extractServiceBlock('kraak-web-staging');

  assert.ok(stagingBlock.length > 0);
  assert.match(stagingBlock, /branch:\s*staging/);
  assert.match(stagingBlock, /autoDeploy:\s*true/);
});

test('Given render.yaml, When reading production web service, Then branch and autoDeploy match expected values', () => {
  const prodBlock = extractServiceBlock('kraak-web-prod');

  assert.ok(prodBlock.length > 0);
  assert.match(prodBlock, /branch:\s*main/);
  assert.match(prodBlock, /autoDeploy:\s*false/);
  assert.match(
    prodBlock,
    /CLIENT_FEATURE_PARTICIPANT_AREA[\s\S]*value:\s*'false'/,
  );
});
