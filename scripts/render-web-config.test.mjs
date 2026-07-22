import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const renderConfig = readFileSync(
  new URL('../render.yaml', import.meta.url),
  'utf8',
);

const extractServiceBlock = (name) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^    name: ${escapedName}\\s*$`, 'm');
  const serviceBlocks = renderConfig.split(/\n(?=  - type: web\n)/);
  const match = serviceBlocks.find((block) => pattern.test(block));

  return match ?? '';
};

test('Given render.yaml, When reading staging web service, Then branch and autoDeploy match expected values', () => {
  const stagingBlock = extractServiceBlock('kraak-web-staging');

  assert.ok(stagingBlock.length > 0);
  assert.match(stagingBlock, /branch:\s*staging/);
  assert.match(stagingBlock, /autoDeploy:\s*true/);
  assert.match(stagingBlock, /staticPublishPath:\s*public/);
});

test('Given render.yaml, When reading production web service, Then branch and autoDeploy match expected values', () => {
  const prodBlock = extractServiceBlock('kraak-web-prod');

  assert.ok(prodBlock.length > 0);
  assert.match(prodBlock, /branch:\s*main/);
  assert.match(prodBlock, /autoDeploy:\s*false/);
  assert.match(prodBlock, /staticPublishPath:\s*public/);
  assert.match(prodBlock, /renderSubdomainPolicy:\s*enabled/);
  assert.match(
    prodBlock,
    /CLIENT_FEATURE_PARTICIPANT_AREA[\s\S]*value:\s*'false'/,
  );
});
