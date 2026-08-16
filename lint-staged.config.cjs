module.exports = {
  'apps/api/src/**/*.ts': [
    'pnpm --filter @kraak/api exec eslint --fix --cache --cache-location .cache/eslint/.eslintcache --max-warnings=0',
  ],
  'apps/client/{projects,tests}/**/*.{ts,html}': [
    'pnpm --filter @kraak/client exec eslint --fix --cache --cache-location .cache/eslint/.eslintcache --max-warnings=0',
  ],
  '**/*.{js,cjs,mjs,jsonc}': [
    'eslint --fix',
    'prettier --write --ignore-unknown',
  ],
  '**/*.md': ['prettier --write --ignore-unknown', 'markdownlint-cli2 --fix'],
  '**/*.{ts,html,scss,css,json,yml,yaml}': [
    'prettier --write --ignore-unknown',
  ],
};
