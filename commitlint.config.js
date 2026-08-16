const scopes = require('./commit-scopes.cjs');

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'docs',
        'test',
        'refactor',
        'ci',
        'style',
        'perf',
        'revert',
        'build',
      ],
    ],
    'scope-enum': [2, 'always', scopes],
    'scope-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-case': [0],
  },
};
