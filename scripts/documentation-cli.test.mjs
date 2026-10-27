import assert from 'node:assert/strict';
import test from 'node:test';

import { parseDocumentationMode } from './documentation-cli.mjs';

test('Given les modes documentaires, When les arguments sont analysés, Then un seul mode explicite est requis', () => {
  assert.deepEqual(parseDocumentationMode(['--check']), { mode: 'check' });
  assert.deepEqual(parseDocumentationMode(['--write']), { mode: 'write' });
  for (const args of [[], ['--check', '--write']]) {
    assert.deepEqual(parseDocumentationMode(args), {
      error: 'Choose exactly one mode: --check or --write.',
    });
  }
});

test('Given une aide ou des options inconnues, When les arguments sont analysés, Then l’aide prime et les erreurs restent explicites', () => {
  assert.deepEqual(parseDocumentationMode(['--help', '--unknown']), {
    mode: 'help',
  });
  assert.deepEqual(parseDocumentationMode(['-h']), { mode: 'help' });
  assert.deepEqual(parseDocumentationMode(['--unknown', 'file']), {
    error: 'Unknown option: --unknown, file',
  });
});
