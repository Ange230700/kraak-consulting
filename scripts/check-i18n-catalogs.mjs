#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const catalogRoot = path.join(
  repoRoot,
  'apps',
  'client',
  'projects',
  'shared',
  'i18n',
  'catalogs',
);
const domainLocalizationPath = path.join(
  repoRoot,
  'packages',
  'domain',
  'src',
  'localization.ts',
);

function main() {
  const contract = readLocaleContract();
  const result = validateCatalogs(contract);

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(error);
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    `i18n catalogs ok: ${contract.supportedLocales.join(', ')} with ${result.keyCount} shared keys.`,
  );
}

function readLocaleContract() {
  const source = readFileSync(domainLocalizationPath, 'utf8');
  const supportedMatch = source.match(
    /SUPPORTED_LOCALES\s*=\s*Object\.freeze\(\s*\[([^\]]+)\]/m,
  );
  const sourceMatch = source.match(
    /SOURCE_LOCALE:\s*SupportedLocale\s*=\s*'([^']+)'/,
  );

  if (!supportedMatch || !sourceMatch) {
    throw new Error('Unable to read domain localization contract.');
  }

  const supportedLocales = [...supportedMatch[1].matchAll(/'([^']+)'/g)].map(
    (match) => match[1],
  );
  const sourceLocale = sourceMatch[1];
  const fallbackLocale = source.includes(
    'FALLBACK_LOCALE: SupportedLocale = SOURCE_LOCALE',
  )
    ? sourceLocale
    : readRequiredMatch(
        source,
        /FALLBACK_LOCALE:\s*SupportedLocale\s*=\s*'([^']+)'/,
        'fallback locale',
      );

  return { fallbackLocale, sourceLocale, supportedLocales };
}

function validateCatalogs(contract) {
  const errors = [];
  const files = readdirSync(catalogRoot)
    .filter((file) => file.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right, 'en'));
  const supportedSet = new Set(contract.supportedLocales);
  const unsupportedFiles = files.filter(
    (file) => !supportedSet.has(path.basename(file, '.json')),
  );

  for (const unsupportedFile of unsupportedFiles) {
    errors.push(`Unsupported i18n catalog found: ${unsupportedFile}`);
  }

  for (const locale of contract.supportedLocales) {
    const filePath = path.join(catalogRoot, `${locale}.json`);

    if (!existsAsFile(filePath)) {
      errors.push(`Missing i18n catalog for ${locale}`);
    }
  }

  if (!supportedSet.has(contract.sourceLocale)) {
    errors.push(`Source locale is not supported: ${contract.sourceLocale}`);
  }

  if (!supportedSet.has(contract.fallbackLocale)) {
    errors.push(`Fallback locale is not supported: ${contract.fallbackLocale}`);
  }

  const catalogEntries = new Map();

  for (const locale of contract.supportedLocales) {
    const filePath = path.join(catalogRoot, `${locale}.json`);

    if (!existsAsFile(filePath)) {
      continue;
    }

    const rawJson = readFileSync(filePath, 'utf8');
    const duplicateKeys = findDuplicateJsonKeys(rawJson);

    for (const key of duplicateKeys) {
      errors.push(`Duplicate key in ${locale}.json: ${key}`);
    }

    try {
      catalogEntries.set(locale, JSON.parse(rawJson));
    } catch (error) {
      errors.push(`Invalid JSON in ${locale}.json: ${error.message}`);
    }
  }

  const sourceCatalog = catalogEntries.get(contract.sourceLocale);
  const sourceKeys = sourceCatalog ? flattenCatalog(sourceCatalog) : new Map();

  for (const [key, value] of sourceKeys) {
    if (isEmptyTranslationValue(value)) {
      errors.push(`Empty translation value: ${contract.sourceLocale}:${key}`);
    }
  }

  for (const locale of contract.supportedLocales) {
    const catalog = catalogEntries.get(locale);

    if (!catalog || locale === contract.sourceLocale) {
      continue;
    }

    const keys = flattenCatalog(catalog);
    compareKeySets(contract.sourceLocale, sourceKeys, locale, keys, errors);
    compareCatalogShapes(
      contract.sourceLocale,
      sourceCatalog,
      locale,
      catalog,
      [],
      errors,
    );
    compareInterpolationVariables(
      contract.sourceLocale,
      sourceKeys,
      locale,
      keys,
      errors,
    );

    for (const [key, value] of keys) {
      if (isEmptyTranslationValue(value)) {
        errors.push(`Empty translation value: ${locale}:${key}`);
      }
    }
  }

  validatePrototypeIcuProof(sourceKeys, contract.sourceLocale, errors);

  return { errors, keyCount: sourceKeys.size };
}

function existsAsFile(filePath) {
  return existsSync(filePath) && statSync(filePath).isFile();
}

function readRequiredMatch(source, pattern, label) {
  const match = source.match(pattern);

  if (!match) {
    throw new Error(`Unable to read ${label}.`);
  }

  return match[1];
}

function compareKeySets(sourceLocale, sourceKeys, locale, keys, errors) {
  for (const key of sourceKeys.keys()) {
    if (!keys.has(key)) {
      errors.push(`Missing key in ${locale}.json: ${key}`);
    }
  }

  for (const key of keys.keys()) {
    if (!sourceKeys.has(key)) {
      errors.push(`Extra key in ${locale}.json: ${key}`);
    }
  }

  if (sourceKeys.size === 0) {
    errors.push(`No keys found in source catalog ${sourceLocale}.json`);
  }
}

function compareCatalogShapes(
  sourceLocale,
  sourceValue,
  locale,
  targetValue,
  pathSegments,
  errors,
) {
  if (Array.isArray(sourceValue) || Array.isArray(targetValue)) {
    if (!Array.isArray(sourceValue) || !Array.isArray(targetValue)) {
      errors.push(`Shape mismatch at ${pathSegments.join('.') || '<root>'}`);
    }

    return;
  }

  if (isPlainObject(sourceValue) || isPlainObject(targetValue)) {
    if (!isPlainObject(sourceValue) || !isPlainObject(targetValue)) {
      errors.push(`Shape mismatch at ${pathSegments.join('.') || '<root>'}`);
      return;
    }

    const keys = new Set([
      ...Object.keys(sourceValue),
      ...Object.keys(targetValue),
    ]);

    for (const key of keys) {
      compareCatalogShapes(
        sourceLocale,
        sourceValue[key],
        locale,
        targetValue[key],
        [...pathSegments, key],
        errors,
      );
    }

    return;
  }

  if (typeof sourceValue !== typeof targetValue) {
    errors.push(
      `Shape mismatch at ${pathSegments.join('.')}: ${sourceLocale} is ${typeof sourceValue}, ${locale} is ${typeof targetValue}`,
    );
  }
}

function compareInterpolationVariables(
  sourceLocale,
  sourceKeys,
  locale,
  keys,
  errors,
) {
  for (const [key, sourceValue] of sourceKeys) {
    const targetValue = keys.get(key);

    if (typeof sourceValue !== 'string' || typeof targetValue !== 'string') {
      continue;
    }

    const sourceVariables = extractVariables(sourceValue);
    const targetVariables = extractVariables(targetValue);

    if (!sameSet(sourceVariables, targetVariables)) {
      errors.push(
        `Interpolation variable mismatch for ${key}: ${sourceLocale} has ${[...sourceVariables].join(', ')}, ${locale} has ${[...targetVariables].join(', ')}`,
      );
    }
  }
}

function validatePrototypeIcuProof(sourceKeys, sourceLocale, errors) {
  const plural = sourceKeys.get('shared.prototype.icuPluralPath');
  const select = sourceKeys.get('shared.prototype.icuSelectPath');

  if (
    typeof plural !== 'string' ||
    !/\{\s*count\s*,\s*plural\s*,/.test(plural)
  ) {
    errors.push(
      `Missing ICU plural proof in ${sourceLocale}.json at shared.prototype.icuPluralPath`,
    );
  }

  if (
    typeof select !== 'string' ||
    !/\{\s*audience\s*,\s*select\s*,/.test(select)
  ) {
    errors.push(
      `Missing ICU select proof in ${sourceLocale}.json at shared.prototype.icuSelectPath`,
    );
  }
}

function flattenCatalog(value, pathSegments = [], entries = new Map()) {
  if (isPlainObject(value)) {
    for (const [key, childValue] of Object.entries(value)) {
      flattenCatalog(childValue, [...pathSegments, key], entries);
    }

    return entries;
  }

  entries.set(pathSegments.join('.'), value);
  return entries;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyTranslationValue(value) {
  return typeof value === 'string' && value.trim() === '';
}

function extractVariables(value) {
  const variables = new Set();

  for (const match of value.matchAll(/\{\{\s*([A-Za-z_$][\w$]*)\s*\}\}/g)) {
    variables.add(match[1]);
  }

  for (const match of value.matchAll(
    /\{\s*([A-Za-z_$][\w$]*)\s*,\s*(?:plural|select)\s*,/g,
  )) {
    variables.add(match[1]);
  }

  return variables;
}

function sameSet(left, right) {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function findDuplicateJsonKeys(source) {
  const parser = new JsonDuplicateKeyParser(source);
  parser.parse();
  return parser.duplicates;
}

class JsonDuplicateKeyParser {
  constructor(source) {
    this.source = source;
    this.index = 0;
    this.duplicates = [];
  }

  parse() {
    this.skipWhitespace();
    this.parseValue([]);
    this.skipWhitespace();

    if (this.index !== this.source.length) {
      throw new Error(`Unexpected JSON token at ${this.index}`);
    }
  }

  parseValue(pathSegments) {
    this.skipWhitespace();
    const character = this.source[this.index];

    if (character === '{') {
      this.parseObject(pathSegments);
      return;
    }

    if (character === '[') {
      this.parseArray(pathSegments);
      return;
    }

    if (character === '"') {
      this.parseString();
      return;
    }

    this.parsePrimitive();
  }

  parseObject(pathSegments) {
    const keys = new Set();
    this.index += 1;
    this.skipWhitespace();

    if (this.source[this.index] === '}') {
      this.index += 1;
      return;
    }

    while (this.index < this.source.length) {
      const key = this.parseString();

      if (keys.has(key)) {
        this.duplicates.push([...pathSegments, key].join('.'));
      }

      keys.add(key);
      this.skipWhitespace();
      this.expect(':');
      this.parseValue([...pathSegments, key]);
      this.skipWhitespace();

      if (this.source[this.index] === '}') {
        this.index += 1;
        return;
      }

      this.expect(',');
      this.skipWhitespace();
    }

    throw new Error('Unterminated JSON object');
  }

  parseArray(pathSegments) {
    this.index += 1;
    this.skipWhitespace();

    if (this.source[this.index] === ']') {
      this.index += 1;
      return;
    }

    let itemIndex = 0;

    while (this.index < this.source.length) {
      this.parseValue([...pathSegments, String(itemIndex)]);
      itemIndex += 1;
      this.skipWhitespace();

      if (this.source[this.index] === ']') {
        this.index += 1;
        return;
      }

      this.expect(',');
      this.skipWhitespace();
    }

    throw new Error('Unterminated JSON array');
  }

  parseString() {
    this.expect('"');
    let result = '';

    while (this.index < this.source.length) {
      const character = this.source[this.index];

      if (character === '"') {
        this.index += 1;
        return result;
      }

      if (character === '\\') {
        result += this.readEscape();
        continue;
      }

      result += character;
      this.index += 1;
    }

    throw new Error('Unterminated JSON string');
  }

  readEscape() {
    this.index += 1;
    const escaped = this.source[this.index];

    if (escaped === 'u') {
      const sequence = this.source.slice(this.index + 1, this.index + 5);
      this.index += 5;
      return String.fromCharCode(Number.parseInt(sequence, 16));
    }

    this.index += 1;
    return escaped;
  }

  parsePrimitive() {
    while (
      this.index < this.source.length &&
      !/[,\]}\s]/.test(this.source[this.index])
    ) {
      this.index += 1;
    }
  }

  skipWhitespace() {
    while (/\s/.test(this.source[this.index] ?? '')) {
      this.index += 1;
    }
  }

  expect(expected) {
    if (this.source[this.index] !== expected) {
      throw new Error(`Expected ${expected} at ${this.index}`);
    }

    this.index += 1;
  }
}

main();
